using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;

namespace Audisoft.Domain.Interfaces;

public interface ISubjectRepository : IRepository<Subject>
{
    Task<Subject?> GetWithTeacherAsync(int id, CancellationToken ct = default);

    /// <summary>Lista paginada con el profesor cargado; <paramref name="search"/> busca en nombre y código.</summary>
    Task<PagedResult<Subject>> GetPagedAsync(
        string? search, int? teacherId, SubjectSortBy sortBy, SortDirection sortDir,
        int page, int pageSize, CancellationToken ct = default);

    Task<IReadOnlyList<Subject>> GetByTeacherAsync(int teacherId, CancellationToken ct = default);
    /// <summary>Agregados del catálogo (créditos, cobertura docente, asignaturas con docente inactivo).</summary>
    Task<SubjectsSummary> GetSummaryAsync(CancellationToken ct = default);

    Task<bool> ExistsByCodeAsync(string code, int? excludeId = null, CancellationToken ct = default);
}
