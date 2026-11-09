using System.ComponentModel.DataAnnotations;
using Audisoft.Application.DTOs.Common;
using Audisoft.Domain.Common;

namespace Audisoft.Application.DTOs.Teachers;

/// <summary>Datos para registrar un profesor.</summary>
public record CreateTeacherDto
{
    /// <example>Laura</example>
    [Required, StringLength(100)]
    public string FirstName { get; init; } = string.Empty;

    /// <example>Gómez</example>
    [Required, StringLength(100)]
    public string LastName { get; init; } = string.Empty;

    /// <example>laura.gomez@universidad.edu.co</example>
    [Required, EmailAddress, StringLength(150)]
    public string Email { get; init; } = string.Empty;
}

/// <summary>Datos para actualizar un profesor.</summary>
public record UpdateTeacherDto : CreateTeacherDto
{
    /// <summary>Indica si el profesor está activo.</summary>
    public bool IsActive { get; init; } = true;
}

/// <summary>Filtros y paginación para listar profesores.</summary>
public record TeacherQuery : PaginationQuery, IValidatableObject
{
    /// <summary>Busca en nombre, apellido y email.</summary>
    public string? Search { get; init; }

    /// <summary>Filtra por estado (true = activos, false = inactivos).</summary>
    public bool? IsActive { get; init; }

    /// <summary>Fecha de registro mínima, incluida (yyyy-MM-dd).</summary>
    /// <example>2025-01-01</example>
    public DateOnly? RegisteredFrom { get; init; }

    /// <summary>Fecha de registro máxima, incluida (yyyy-MM-dd).</summary>
    /// <example>2025-12-31</example>
    public DateOnly? RegisteredTo { get; init; }

    /// <summary>Filtra por carga docente (true = con asignaturas a cargo, false = sin asignaturas).</summary>
    public bool? HasSubjects { get; init; }

    /// <summary>Columna de ordenamiento: name (apellido y nombre, por defecto) o createdAt (fecha de registro).</summary>
    public TeacherSortBy SortBy { get; init; } = TeacherSortBy.Name;

    /// <summary>Dirección: asc (por defecto) o desc.</summary>
    public SortDirection SortDir { get; init; } = SortDirection.Asc;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (RegisteredFrom > RegisteredTo)
            yield return new ValidationResult(
                "La fecha inicial de registro no puede ser posterior a la fecha final.",
                [nameof(RegisteredFrom)]);
    }

    public TeacherFilter ToFilter() => new(Search, IsActive, RegisteredFrom, RegisteredTo, HasSubjects, SortBy, SortDir);
}

/// <summary>Representación de un profesor.</summary>
/// <param name="Id">Id del profesor.</param>
/// <param name="FirstName">Nombre.</param>
/// <param name="LastName">Apellido.</param>
/// <param name="Email">Correo electrónico.</param>
/// <param name="CreatedAt">Fecha de registro.</param>
/// <param name="IsActive">Indica si el profesor está activo.</param>
/// <param name="SubjectCount">Número de asignaturas a cargo.</param>
public record TeacherResponseDto(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    DateTime CreatedAt,
    bool IsActive,
    int SubjectCount);

/// <summary>Indicadores del cuerpo docente.</summary>
/// <param name="Total">Profesores registrados.</param>
/// <param name="Active">Profesores activos.</param>
/// <param name="Inactive">Profesores inactivos.</param>
/// <param name="Subjects">Asignaturas registradas (todas tienen un docente a cargo).</param>
public record TeachersSummaryDto(int Total, int Active, int Inactive, int Subjects);
