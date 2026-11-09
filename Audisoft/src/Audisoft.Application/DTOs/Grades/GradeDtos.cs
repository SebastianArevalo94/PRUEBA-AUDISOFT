using System.ComponentModel.DataAnnotations;
using Audisoft.Application.DTOs.Common;

namespace Audisoft.Application.DTOs.Grades;

/// <summary>Datos para registrar una nota.</summary>
public record CreateGradeDto
{
    /// <example>Parcial 1</example>
    [Required, StringLength(100)]
    public string Name { get; init; } = string.Empty;

    /// <summary>Calificación entre 0.0 y 5.0.</summary>
    /// <example>4.25</example>
    [Range(typeof(decimal), "0.0", "5.0")]
    public decimal Value { get; init; }

    /// <summary>Peso de la nota dentro de la asignatura (mayor que 0 y hasta 100).</summary>
    /// <example>20</example>
    [Range(typeof(decimal), "0.01", "100")]
    public decimal Percentage { get; init; }

    /// <example>1</example>
    [Range(1, int.MaxValue)]
    public int StudentId { get; init; }

    /// <summary>Debe ser el profesor asignado a la asignatura.</summary>
    /// <example>1</example>
    [Range(1, int.MaxValue)]
    public int TeacherId { get; init; }

    /// <example>1</example>
    [Range(1, int.MaxValue)]
    public int SubjectId { get; init; }
}

/// <summary>Datos para corregir una nota. Estudiante, profesor y asignatura no se modifican.</summary>
public record UpdateGradeDto
{
    /// <example>Parcial 1</example>
    [Required, StringLength(100)]
    public string Name { get; init; } = string.Empty;

    /// <example>3.8</example>
    [Range(typeof(decimal), "0.0", "5.0")]
    public decimal Value { get; init; }

    /// <example>20</example>
    [Range(typeof(decimal), "0.01", "100")]
    public decimal Percentage { get; init; }
}

/// <summary>Filtros combinables y paginación para listar notas.</summary>
public record GradeQuery : PaginationQuery
{
    /// <summary>Filtra por estudiante.</summary>
    public int? StudentId { get; init; }

    /// <summary>Filtra por profesor.</summary>
    public int? TeacherId { get; init; }

    /// <summary>Filtra por asignatura.</summary>
    public int? SubjectId { get; init; }
}

/// <summary>Detalle de una nota con sus relaciones.</summary>
public record GradeDetailDto(
    int Id,
    string Name,
    decimal Value,
    decimal Percentage,
    DateTime RecordedAt,
    int StudentId,
    string StudentName,
    string StudentCode,
    int TeacherId,
    string TeacherName,
    int SubjectId,
    string SubjectCode,
    string SubjectName);

/// <summary>Filtros combinables para el resumen de notas (los mismos del listado, sin paginación).</summary>
public record GradeSummaryQuery
{
    /// <summary>Filtra por estudiante.</summary>
    public int? StudentId { get; init; }

    /// <summary>Filtra por profesor.</summary>
    public int? TeacherId { get; init; }

    /// <summary>Filtra por asignatura.</summary>
    public int? SubjectId { get; init; }
}

/// <summary>Cantidad de notas en un rango de valores.</summary>
/// <param name="Label">Etiqueta, p. ej. "3.0–3.9".</param>
/// <param name="From">Límite inferior (incluido).</param>
/// <param name="To">Límite superior (excluido, salvo en el último rango que incluye 5.0).</param>
/// <param name="Count">Notas en el rango.</param>
public record GradeRangeDto(string Label, decimal From, decimal To, int Count);

/// <summary>Indicadores de las notas que cumplen los filtros.</summary>
/// <param name="Total">Notas registradas.</param>
/// <param name="Average">Media simple de los valores, redondeada a 2 decimales (null si no hay notas).</param>
/// <param name="Passed">Notas con valor ≥ 3.0.</param>
/// <param name="Failed">Notas con valor &lt; 3.0.</param>
/// <param name="PassRate">Porcentaje de notas aprobadas, con 1 decimal (null si no hay notas).</param>
/// <param name="SubjectsGraded">Asignaturas distintas con notas.</param>
/// <param name="StudentsGraded">Estudiantes distintos con notas.</param>
/// <param name="Distribution">Histograma por rangos: &lt;2.0, 2.0–2.9, 3.0–3.9, 4.0–4.7, 4.8–5.0.</param>
public record GradesSummaryDto(
    int Total,
    decimal? Average,
    int Passed,
    int Failed,
    decimal? PassRate,
    int SubjectsGraded,
    int StudentsGraded,
    IReadOnlyList<GradeRangeDto> Distribution);
