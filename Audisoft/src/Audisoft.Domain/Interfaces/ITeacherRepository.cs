using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;

namespace Audisoft.Domain.Interfaces;

public interface ITeacherRepository : IRepository<Teacher>
{
    /// <summary>Lista paginada con sus asignaturas cargadas; filtra por búsqueda (nombre, apellido, email), estado y fecha de registro.</summary>
    Task<PagedResult<Teacher>> GetPagedAsync(TeacherFilter filter, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Total y activos en una sola consulta.</summary>
    Task<StatusSummary> GetSummaryAsync(CancellationToken ct = default);

    Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken ct = default);
}
