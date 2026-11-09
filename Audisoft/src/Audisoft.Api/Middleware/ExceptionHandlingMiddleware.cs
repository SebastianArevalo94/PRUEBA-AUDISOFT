using Audisoft.Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Api.Middleware;

/// <summary>
/// Captura cualquier excepción no controlada y la traduce a una respuesta RFC 7807 (ProblemDetails),
/// registrando el error con logs estructurados.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation("Solicitud cancelada por el cliente: {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Recurso no encontrado"),
            ConflictException => (StatusCodes.Status409Conflict, "Conflicto con el estado actual"),
            BusinessRuleException => (StatusCodes.Status422UnprocessableEntity, "Regla de negocio incumplida"),
            DbUpdateException => (StatusCodes.Status409Conflict, "Error de integridad de datos"),
            _ => (StatusCodes.Status500InternalServerError, "Error interno del servidor")
        };

        var traceId = context.TraceIdentifier;

        if (status >= StatusCodes.Status500InternalServerError)
            _logger.LogError(exception,
                "Excepción no controlada en {Method} {Path}. TraceId: {TraceId}",
                context.Request.Method, context.Request.Path, traceId);
        else
            _logger.LogWarning(
                "Solicitud rechazada {StatusCode} en {Method} {Path}: {ErrorMessage} (TraceId: {TraceId})",
                status, context.Request.Method, context.Request.Path, exception.Message, traceId);

        // Solo los mensajes de excepciones controladas se exponen al cliente.
        var detail = exception switch
        {
            AppException => exception.Message,
            DbUpdateException => "La operación viola una restricción de la base de datos.",
            _ when _environment.IsDevelopment() => exception.ToString(),
            _ => "Ocurrió un error inesperado. Contacte al administrador con el traceId."
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = $"https://httpstatuses.io/{status}",
            Instance = context.Request.Path
        };
        problem.Extensions["traceId"] = traceId;

        if (context.Response.HasStarted)
        {
            _logger.LogWarning("La respuesta ya había comenzado; no se puede escribir ProblemDetails. TraceId: {TraceId}", traceId);
            return;
        }

        // No usar Response.Clear(): borraría las cabeceras CORS y el navegador ocultaría el error al frontend.
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
    }
}
