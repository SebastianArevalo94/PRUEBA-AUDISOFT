namespace Audisoft.Application.Common.Exceptions;

/// <summary>Base de las excepciones controladas de la aplicación (se traducen a respuestas 4xx).</summary>
public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
}

/// <summary>El recurso solicitado no existe (404).</summary>
public sealed class NotFoundException : AppException
{
    public NotFoundException(string resource, object id)
        : base($"{resource} con id '{id}' no fue encontrado.") { }
}

/// <summary>La operación entra en conflicto con el estado actual, p. ej. un valor único repetido (409).</summary>
public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Se violó una regla de negocio (422).</summary>
public sealed class BusinessRuleException : AppException
{
    public BusinessRuleException(string message) : base(message) { }
}
