using System.Reflection;
using Audisoft.Api.Extensions;
using Audisoft.Api.Middleware;
using Audisoft.Application;
using Audisoft.Infrastructure;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------- Capas (inyección de dependencias nativa) ----------
builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

// ---------- CORS (frontend Angular) ----------
const string FrontendCorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// ---------- API ----------
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddRouting(options => options.LowercaseUrls = true);

// ---------- Health check (indicador "Estado del sistema" del frontend) ----------
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

// ---------- Swagger / OpenAPI con comentarios XML ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Audisoft - Gestión Académica API",
        Version = "v1",
        Description = "API REST para la gestión de profesores, estudiantes, asignaturas y notas."
    });

    // Incluye la documentación XML de la API, de Application (DTOs) y de Domain (PagedResult).
    foreach (var assembly in new[]
             {
                 Assembly.GetExecutingAssembly(),
                 typeof(Audisoft.Application.DependencyInjection).Assembly,
                 typeof(Audisoft.Domain.Common.PagedResult<>).Assembly
             })
    {
        var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{assembly.GetName().Name}.xml");
        if (File.Exists(xmlPath))
            options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }
});

var app = builder.Build();

// ---------- Pipeline ----------
// CORS va primero para que también las respuestas de error lleven las cabeceras Access-Control-*.
app.UseCors(FrontendCorsPolicy);
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
    await app.ApplyMigrationsAsync();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Audisoft API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
// 200 "Healthy" / 503 "Unhealthy"; ligero, sin consultar tablas.
app.MapHealthChecks("/health");

app.Run();

/// <summary>Expuesto para pruebas de integración (WebApplicationFactory).</summary>
public partial class Program { }
