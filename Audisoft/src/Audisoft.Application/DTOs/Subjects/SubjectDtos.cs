using System.ComponentModel.DataAnnotations;
using Audisoft.Application.DTOs.Common;
using Audisoft.Domain.Common;

namespace Audisoft.Application.DTOs.Subjects;

/// <summary>Datos para crear o actualizar una asignatura.</summary>
public record CreateSubjectDto
{
    /// <example>Bases de Datos I</example>
    [Required, StringLength(150)]
    public string Name { get; init; } = string.Empty;

    /// <example>BD-101</example>
    [Required, StringLength(20)]
    public string Code { get; init; } = string.Empty;

    /// <example>3</example>
    [Range(1, 30)]
    public int Credits { get; init; }

    /// <summary>Profesor responsable de la asignatura.</summary>
    /// <example>1</example>
    [Range(1, int.MaxValue)]
    public int TeacherId { get; init; }
}

/// <summary>Datos para actualizar una asignatura.</summary>
public record UpdateSubjectDto : CreateSubjectDto;

/// <summary>Filtros y paginación para listar asignaturas.</summary>
public record SubjectQuery : PaginationQuery
{
    /// <summary>Busca en nombre y código.</summary>
    public string? Search { get; init; }

    /// <summary>Filtra por profesor responsable.</summary>
    public int? TeacherId { get; init; }

    /// <summary>Columna de ordenamiento: code (por defecto) o name.</summary>
    public SubjectSortBy SortBy { get; init; } = SubjectSortBy.Code;

    /// <summary>Dirección: asc (por defecto) o desc.</summary>
    public SortDirection SortDir { get; init; } = SortDirection.Asc;
}

/// <summary>Representación de una asignatura.</summary>
public record SubjectResponseDto(
    int Id,
    string Name,
    string Code,
    int Credits,
    int TeacherId,
    string? TeacherName);

/// <summary>Indicadores del catálogo de asignaturas.</summary>
/// <param name="Total">Asignaturas registradas.</param>
/// <param name="TotalCredits">Suma de créditos del catálogo.</param>
/// <param name="TeachersWithLoad">Profesores activos con al menos una asignatura.</param>
/// <param name="ActiveTeachers">Profesores activos.</param>
/// <param name="WithInactiveTeacher">Asignaturas cuyo profesor está inactivo (requieren reasignación).</param>
public record SubjectsSummaryDto(int Total, int TotalCredits, int TeachersWithLoad, int ActiveTeachers, int WithInactiveTeacher);
