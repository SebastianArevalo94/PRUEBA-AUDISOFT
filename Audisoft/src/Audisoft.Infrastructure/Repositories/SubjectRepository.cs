using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Infrastructure.Repositories;

public class SubjectRepository : Repository<Subject>, ISubjectRepository
{
    public SubjectRepository(ApplicationDbContext context) : base(context) { }

    public Task<Subject?> GetWithTeacherAsync(int id, CancellationToken ct = default) =>
        DbSet.AsNoTracking().Include(a => a.Teacher).FirstOrDefaultAsync(a => a.Id == id, ct);

    public Task<PagedResult<Subject>> GetPagedAsync(
        string? search, int? teacherId, SubjectSortBy sortBy, SortDirection sortDir,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.AsNoTracking().Include(a => a.Teacher).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => EF.Functions.Collate(a.Name, SearchCollation).Contains(term)
                                     || a.Code.Contains(term));
        }
        if (teacherId is not null) query = query.Where(a => a.TeacherId == teacherId);

        return ToPagedAsync(ApplySorting(query, sortBy, sortDir), page, pageSize, ct);
    }

    /// <summary>Ordena por la columna pedida; el código (único) desempata para un orden estable entre páginas.</summary>
    private static IOrderedQueryable<Subject> ApplySorting(IQueryable<Subject> query, SubjectSortBy sortBy, SortDirection dir)
    {
        var desc = dir == SortDirection.Desc;
        return sortBy switch
        {
            SubjectSortBy.Name => (desc ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name))
                .ThenBy(a => a.Code).ThenBy(a => a.Id),
            _ => (desc ? query.OrderByDescending(a => a.Code) : query.OrderBy(a => a.Code)).ThenBy(a => a.Id)
        };
    }

    public async Task<IReadOnlyList<Subject>> GetByTeacherAsync(int teacherId, CancellationToken ct = default) =>
        await DbSet.AsNoTracking()
            .Include(a => a.Teacher)
            .Where(a => a.TeacherId == teacherId)
            .OrderBy(a => a.Code)
            .ToListAsync(ct);

    public async Task<SubjectsSummary> GetSummaryAsync(CancellationToken ct = default)
    {
        // Consultas escalares (COUNT/SUM) en la base de datos: no se cargan filas en memoria.
        // Se ejecutan en secuencia porque comparten el DbContext.
        var subjects = DbSet.AsNoTracking();
        var total = await subjects.CountAsync(ct);
        var credits = await subjects.SumAsync(a => a.Credits, ct);
        var withInactiveTeacher = await subjects.CountAsync(a => !a.Teacher.IsActive, ct);
        var teachersWithLoad = await subjects.Where(a => a.Teacher.IsActive).Select(a => a.TeacherId).Distinct().CountAsync(ct);
        var activeTeachers = await Context.Set<Teacher>().CountAsync(p => p.IsActive, ct);

        return new SubjectsSummary(total, credits, teachersWithLoad, activeTeachers, withInactiveTeacher);
    }

    public Task<bool> ExistsByCodeAsync(string code, int? excludeId = null, CancellationToken ct = default) =>
        DbSet.AnyAsync(a => a.Code == code && (excludeId == null || a.Id != excludeId), ct);
}
