using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Infrastructure.Repositories;

public class TeacherRepository : Repository<Teacher>, ITeacherRepository
{
    public TeacherRepository(ApplicationDbContext context) : base(context) { }

    public Task<PagedResult<Teacher>> GetPagedAsync(TeacherFilter filter, int page, int pageSize, CancellationToken ct = default)
    {
        var (search, isActive) = (filter.Search, filter.IsActive);
        // Incluye las asignaturas (sin las eliminadas, por el filtro global) para informar cuántas tiene a cargo.
        var query = DbSet.AsNoTracking().Include(p => p.Subjects).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => EF.Functions.Collate(p.FirstName, SearchCollation).Contains(term)
                                     || EF.Functions.Collate(p.LastName, SearchCollation).Contains(term)
                                     || p.Email.Contains(term));
        }
        if (isActive is not null) query = query.Where(p => p.IsActive == isActive);

        // Rango por días completos: [desde 00:00, hasta + 1 día 00:00).
        if (filter.RegisteredFrom is { } lowerBound)
        {
            var start = lowerBound.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.CreatedAt >= start);
        }
        if (filter.RegisteredTo is { } upperBound)
        {
            var end = upperBound.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.CreatedAt < end);
        }

        // El filtro global de borrado lógico también aplica a la subconsulta: no cuentan asignaturas eliminadas.
        if (filter.HasSubjects is { } hasSubjects)
            query = query.Where(p => p.Subjects.Any() == hasSubjects);

        return ToPagedAsync(ApplySorting(query, filter.SortBy, filter.SortDir), page, pageSize, ct);
    }

    /// <summary>Ordena por la columna pedida; los desempates (apellido, nombre, id) dan un orden estable entre páginas.</summary>
    private static IOrderedQueryable<Teacher> ApplySorting(IQueryable<Teacher> query, TeacherSortBy sortBy, SortDirection dir)
    {
        var desc = dir == SortDirection.Desc;
        var ordered = sortBy switch
        {
            TeacherSortBy.CreatedAt => desc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => desc
                ? query.OrderByDescending(p => p.LastName).ThenByDescending(p => p.FirstName)
                : query.OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
        };
        return ordered.ThenBy(p => p.LastName).ThenBy(p => p.FirstName).ThenBy(p => p.Id);
    }

    public async Task<StatusSummary> GetSummaryAsync(CancellationToken ct = default) =>
        // GroupBy por constante: un único SELECT COUNT(*), COUNT(CASE WHEN Activo …).
        await DbSet.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new StatusSummary(g.Count(), g.Count(x => x.IsActive)))
            .FirstOrDefaultAsync(ct)
        ?? new StatusSummary(0, 0);

    public Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken ct = default) =>
        DbSet.AnyAsync(p => p.Email == email && (excludeId == null || p.Id != excludeId), ct);
}
