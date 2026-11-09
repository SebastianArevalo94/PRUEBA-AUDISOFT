namespace Audisoft.Domain.Common;

/// <summary>Conteo de registros por estado (calculado en una sola consulta).</summary>
/// <param name="Total">Registros no eliminados.</param>
/// <param name="Active">Registros activos.</param>
public record StatusSummary(int Total, int Active);

/// <summary>Agregados del catálogo de asignaturas.</summary>
/// <param name="Total">Asignaturas no eliminadas.</param>
/// <param name="TotalCredits">Suma de créditos.</param>
/// <param name="TeachersWithLoad">Profesores activos con al menos una asignatura.</param>
/// <param name="ActiveTeachers">Profesores activos.</param>
/// <param name="WithInactiveTeacher">Asignaturas cuyo profesor está inactivo.</param>
public record SubjectsSummary(int Total, int TotalCredits, int TeachersWithLoad, int ActiveTeachers, int WithInactiveTeacher);

/// <summary>Agregados de un conjunto de notas.</summary>
/// <param name="Total">Notas registradas.</param>
/// <param name="Average">Media simple de los valores (null si no hay notas).</param>
/// <param name="Passed">Notas con valor ≥ nota aprobatoria.</param>
/// <param name="SubjectsGraded">Asignaturas distintas con notas.</param>
/// <param name="StudentsGraded">Estudiantes distintos con notas.</param>
/// <param name="Distribution">Cantidad de notas por rango, en el orden de <c>Grade.DistributionBounds</c> (5 rangos).</param>
public record GradesSummary(
    int Total, decimal? Average, int Passed, int SubjectsGraded, int StudentsGraded, IReadOnlyList<int> Distribution);
