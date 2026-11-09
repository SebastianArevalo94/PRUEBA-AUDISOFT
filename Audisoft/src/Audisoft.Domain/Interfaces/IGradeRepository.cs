using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;

namespace Audisoft.Domain.Interfaces;

public interface IGradeRepository : IRepository<Grade>
{
    /// <summary>Obtiene una nota con estudiante, profesor y asignatura cargados.</summary>
    Task<Grade?> GetDetailAsync(int id, CancellationToken ct = default);

    /// <summary>Lista todas las notas (con relaciones) que cumplen los filtros no nulos.</summary>
    Task<IReadOnlyList<Grade>> GetFilteredAsync(
        int? studentId, int? teacherId, int? subjectId, CancellationToken ct = default);

    /// <summary>Lista paginada (con relaciones), de la más reciente a la más antigua.</summary>
    Task<PagedResult<Grade>> GetPagedAsync(
        int? studentId, int? teacherId, int? subjectId, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Agregados (promedio, aprobadas, distribución…) de las notas que cumplen los filtros no nulos.</summary>
    Task<GradesSummary> GetSummaryAsync(
        int? studentId, int? teacherId, int? subjectId, CancellationToken ct = default);

    /// <summary>Suma de porcentajes ya registrados para un estudiante en una asignatura.</summary>
    Task<decimal> SumPercentageAsync(
        int studentId, int subjectId, int? excludeGradeId = null, CancellationToken ct = default);
}
