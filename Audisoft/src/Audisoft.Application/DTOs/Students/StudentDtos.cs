using System.ComponentModel.DataAnnotations;
using Audisoft.Application.DTOs.Common;
using Audisoft.Domain.Common;

namespace Audisoft.Application.DTOs.Students;

/// <summary>Datos para matricular un estudiante.</summary>
public record CreateStudentDto
{
    /// <example>Carlos</example>
    [Required, StringLength(100)]
    public string FirstName { get; init; } = string.Empty;

    /// <example>Pérez</example>
    [Required, StringLength(100)]
    public string LastName { get; init; } = string.Empty;

    /// <example>carlos.perez@universidad.edu.co</example>
    [Required, EmailAddress, StringLength(150)]
    public string Email { get; init; } = string.Empty;

    /// <example>EST-2026-0001</example>
    [Required, StringLength(20)]
    public string StudentCode { get; init; } = string.Empty;

    /// <summary>Fecha de matrícula. Si se omite se usa la fecha actual (UTC).</summary>
    public DateTime? EnrollmentDate { get; init; }
}

/// <summary>Datos para actualizar un estudiante.</summary>
public record UpdateStudentDto : CreateStudentDto
{
    /// <summary>Indica si el estudiante está activo.</summary>
    public bool IsActive { get; init; } = true;
}

/// <summary>Filtros, ordenamiento y paginación para listar estudiantes.</summary>
public record StudentQuery : PaginationQuery, IValidatableObject
{
    /// <summary>Busca en nombre, apellido, email y código estudiantil.</summary>
    public string? Search { get; init; }

    /// <summary>Filtra por estado (true = activos, false = inactivos).</summary>
    public bool? IsActive { get; init; }

    /// <summary>Fecha de matrícula mínima, incluida (yyyy-MM-dd).</summary>
    /// <example>2025-01-01</example>
    public DateOnly? EnrolledFrom { get; init; }

    /// <summary>Fecha de matrícula máxima, incluida (yyyy-MM-dd).</summary>
    /// <example>2025-12-31</example>
    public DateOnly? EnrolledTo { get; init; }

    /// <summary>Columna de ordenamiento: name (apellido y nombre, por defecto), code o enrollmentDate.</summary>
    public StudentSortBy SortBy { get; init; } = StudentSortBy.Name;

    /// <summary>Dirección: asc (por defecto) o desc.</summary>
    public SortDirection SortDir { get; init; } = SortDirection.Asc;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EnrolledFrom > EnrolledTo)
            yield return new ValidationResult(
                "La fecha inicial de matrícula no puede ser posterior a la fecha final.",
                [nameof(EnrolledFrom)]);
    }

    public StudentFilter ToFilter() => new(Search, IsActive, EnrolledFrom, EnrolledTo, SortBy, SortDir);
}

/// <summary>Representación de un estudiante.</summary>
public record StudentResponseDto(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string StudentCode,
    DateTime EnrollmentDate,
    bool IsActive);

/// <summary>Promedio ponderado del estudiante en una asignatura.</summary>
/// <param name="SubjectId">Id de la asignatura.</param>
/// <param name="Code">Código de la asignatura.</param>
/// <param name="Name">Nombre de la asignatura.</param>
/// <param name="Credits">Créditos de la asignatura (peso en el promedio general).</param>
/// <param name="GradeCount">Número de notas registradas.</param>
/// <param name="EvaluatedPercentage">Suma de los porcentajes de las notas registradas (0–100).</param>
/// <param name="WeightedAverage">Σ(valor·porcentaje) / Σ(porcentaje): promedio sobre lo evaluado hasta ahora.</param>
/// <param name="AccumulatedGrade">Σ(valor·porcentaje) / 100: aporte acumulado a la nota definitiva.</param>
public record SubjectAverageDto(
    int SubjectId,
    string Code,
    string Name,
    int Credits,
    int GradeCount,
    decimal EvaluatedPercentage,
    decimal WeightedAverage,
    decimal AccumulatedGrade);

/// <summary>Resumen académico del estudiante.</summary>
/// <param name="StudentId">Id del estudiante.</param>
/// <param name="FullName">Nombre y apellido.</param>
/// <param name="StudentCode">Código estudiantil.</param>
/// <param name="OverallAverage">Promedio de las asignaturas ponderado por créditos; null si no tiene notas.</param>
/// <param name="Subjects">Detalle por asignatura.</param>
public record StudentAverageDto(
    int StudentId,
    string FullName,
    string StudentCode,
    decimal? OverallAverage,
    IReadOnlyList<SubjectAverageDto> Subjects);

/// <summary>Indicadores de matrícula.</summary>
/// <param name="Total">Estudiantes registrados.</param>
/// <param name="Active">Estudiantes activos.</param>
/// <param name="Inactive">Estudiantes inactivos.</param>
public record StudentsSummaryDto(int Total, int Active, int Inactive);
