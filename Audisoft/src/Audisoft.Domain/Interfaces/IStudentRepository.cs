using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;

namespace Audisoft.Domain.Interfaces;

public interface IStudentRepository : IRepository<Student>
{
    /// <summary>Lista paginada con búsqueda, filtros por estado y rango de matrícula, y ordenamiento.</summary>
    Task<PagedResult<Student>> GetPagedAsync(StudentFilter filter, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Total y activos en una sola consulta.</summary>
    Task<StatusSummary> GetSummaryAsync(CancellationToken ct = default);

    Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken ct = default);
    Task<bool> ExistsByCodeAsync(string studentCode, int? excludeId = null, CancellationToken ct = default);
}
