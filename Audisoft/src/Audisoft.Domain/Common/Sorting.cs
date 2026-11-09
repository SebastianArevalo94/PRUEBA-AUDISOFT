namespace Audisoft.Domain.Common;

/// <summary>Dirección de ordenamiento de un listado.</summary>
public enum SortDirection
{
    Asc,
    Desc
}

/// <summary>Columnas por las que se puede ordenar el listado de estudiantes.</summary>
public enum StudentSortBy
{
    /// <summary>Apellido y luego nombre (orden por defecto).</summary>
    Name,

    /// <summary>Código estudiantil.</summary>
    Code,

    /// <summary>Fecha de matrícula.</summary>
    EnrollmentDate
}

/// <summary>Columnas por las que se puede ordenar el listado de profesores.</summary>
public enum TeacherSortBy
{
    /// <summary>Apellido y luego nombre (orden por defecto).</summary>
    Name,

    /// <summary>Fecha de registro.</summary>
    CreatedAt
}

/// <summary>Columnas por las que se puede ordenar el catálogo de asignaturas.</summary>
public enum SubjectSortBy
{
    /// <summary>Código de la asignatura (orden por defecto).</summary>
    Code,

    /// <summary>Nombre de la asignatura.</summary>
    Name
}

/// <summary>Criterios del listado de estudiantes (todos opcionales salvo paginación y orden).</summary>
/// <param name="Search">Busca en nombre, apellido, email y código estudiantil.</param>
/// <param name="IsActive">Filtra por estado.</param>
/// <param name="EnrolledFrom">Fecha de matrícula mínima (incluida).</param>
/// <param name="EnrolledTo">Fecha de matrícula máxima (incluida, el día completo).</param>
/// <param name="SortBy">Columna de ordenamiento.</param>
/// <param name="SortDir">Dirección de ordenamiento.</param>
public record StudentFilter(
    string? Search,
    bool? IsActive,
    DateOnly? EnrolledFrom,
    DateOnly? EnrolledTo,
    StudentSortBy SortBy,
    SortDirection SortDir);

/// <summary>Criterios del listado de profesores.</summary>
/// <param name="Search">Busca en nombre, apellido y email.</param>
/// <param name="IsActive">Filtra por estado.</param>
/// <param name="RegisteredFrom">Fecha de registro mínima (incluida).</param>
/// <param name="RegisteredTo">Fecha de registro máxima (incluida, el día completo).</param>
/// <param name="HasSubjects">true = con al menos una asignatura a cargo; false = sin asignaturas.</param>
/// <param name="SortBy">Columna de ordenamiento.</param>
/// <param name="SortDir">Dirección de ordenamiento.</param>
public record TeacherFilter(
    string? Search,
    bool? IsActive,
    DateOnly? RegisteredFrom,
    DateOnly? RegisteredTo,
    bool? HasSubjects,
    TeacherSortBy SortBy,
    SortDirection SortDir);
