using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Infrastructure.Repositories;

public class StudentRepository : Repository<Student>, IStudentRepository
{
    public StudentRepository(ApplicationDbContext context) : base(context) { }

    public Task<PagedResult<Student>> GetPagedAsync(
        StudentFilter filter, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(e => EF.Functions.Collate(e.FirstName, SearchCollation).Contains(term)
                                     || EF.Functions.Collate(e.LastName, SearchCollation).Contains(term)
                                     || e.Email.Contains(term) || e.StudentCode.Contains(term));
        }
        if (filter.IsActive is not null) query = query.Where(e => e.IsActive == filter.IsActive);

        // Rango por días completos: [desde 00:00, hasta + 1 día 00:00).
        if (filter.EnrolledFrom is { } lowerBound)
        {
            var start = lowerBound.ToDateTime(TimeOnly.MinValue);
            query = query.Where(e => e.EnrollmentDate >= start);
        }
        if (filter.EnrolledTo is { } upperBound)
        {
            var end = upperBound.AddDays(1).ToDateTime(TimeOnly.MinValue);
            query = query.Where(e => e.EnrollmentDate < end);
        }

        return ToPagedAsync(ApplySorting(query, filter.SortBy, filter.SortDir), page, pageSize, ct);
    }

    /// <summary>Ordena por la columna pedida; los desempates (apellido, nombre, id) dan un orden estable entre páginas.</summary>
    private static IOrderedQueryable<Student> ApplySorting(IQueryable<Student> query, StudentSortBy sortBy, SortDirection dir)
    {
        var desc = dir == SortDirection.Desc;
        var ordered = sortBy switch
        {
            StudentSortBy.Code => desc ? query.OrderByDescending(e => e.StudentCode) : query.OrderBy(e => e.StudentCode),
            StudentSortBy.EnrollmentDate => desc ? query.OrderByDescending(e => e.EnrollmentDate) : query.OrderBy(e => e.EnrollmentDate),
            _ => desc
                ? query.OrderByDescending(e => e.LastName).ThenByDescending(e => e.FirstName)
                : query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName)
        };
        return ordered.ThenBy(e => e.LastName).ThenBy(e => e.FirstName).ThenBy(e => e.Id);
    }

    public async Task<StatusSummary> GetSummaryAsync(CancellationToken ct = default) =>
        // GroupBy por constante: un único SELECT COUNT(*), COUNT(CASE WHEN Activo …).
        await DbSet.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new StatusSummary(g.Count(), g.Count(x => x.IsActive)))
            .FirstOrDefaultAsync(ct)
        ?? new StatusSummary(0, 0);

    public Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken ct = default) =>
        DbSet.AnyAsync(e => e.Email == email && (excludeId == null || e.Id != excludeId), ct);

    public Task<bool> ExistsByCodeAsync(string studentCode, int? excludeId = null, CancellationToken ct = default) =>
        DbSet.AnyAsync(e => e.StudentCode == studentCode && (excludeId == null || e.Id != excludeId), ct);
}
