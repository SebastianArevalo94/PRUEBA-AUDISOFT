using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Infrastructure.Repositories;

public class GradeRepository : Repository<Grade>, IGradeRepository
{
    public GradeRepository(ApplicationDbContext context) : base(context) { }

    public Task<Grade?> GetDetailAsync(int id, CancellationToken ct = default) =>
        WithDetails().FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<IReadOnlyList<Grade>> GetFilteredAsync(
        int? studentId, int? teacherId, int? subjectId, CancellationToken ct = default) =>
        await Filter(WithDetails(), studentId, teacherId, subjectId)
            .OrderBy(n => n.SubjectId).ThenBy(n => n.RecordedAt)
            .ToListAsync(ct);

    public Task<PagedResult<Grade>> GetPagedAsync(
        int? studentId, int? teacherId, int? subjectId, int page, int pageSize, CancellationToken ct = default) =>
        ToPagedAsync(
            Filter(WithDetails(), studentId, teacherId, subjectId)
                .OrderByDescending(n => n.RecordedAt).ThenByDescending(n => n.Id),
            page, pageSize, ct);

    public async Task<GradesSummary> GetSummaryAsync(
        int? studentId, int? teacherId, int? subjectId, CancellationToken ct = default)
    {
        var query = Filter(DbSet.AsNoTracking(), studentId, teacherId, subjectId);
        var passingGrade = Grade.PassingGrade;
        var (l1, l2, l3, l4) = (Grade.DistributionBounds[0], Grade.DistributionBounds[1],
                                Grade.DistributionBounds[2], Grade.DistributionBounds[3]);

        // Un único SELECT con COUNT/AVG condicionales (GroupBy por constante).
        var aggregates = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Average = g.Average(n => (decimal?)n.Value),
                Passed = g.Count(n => n.Value >= passingGrade),
                R1 = g.Count(n => n.Value < l1),
                R2 = g.Count(n => n.Value >= l1 && n.Value < l2),
                R3 = g.Count(n => n.Value >= l2 && n.Value < l3),
                R4 = g.Count(n => n.Value >= l3 && n.Value < l4),
                R5 = g.Count(n => n.Value >= l4)
            })
            .FirstOrDefaultAsync(ct);

        if (aggregates is null) return new GradesSummary(0, null, 0, 0, 0, [0, 0, 0, 0, 0]);

        var subjects = await query.Select(n => n.SubjectId).Distinct().CountAsync(ct);
        var students = await query.Select(n => n.StudentId).Distinct().CountAsync(ct);

        return new GradesSummary(aggregates.Total, aggregates.Average, aggregates.Passed, subjects, students,
            [aggregates.R1, aggregates.R2, aggregates.R3, aggregates.R4, aggregates.R5]);
    }

    public Task<decimal> SumPercentageAsync(
        int studentId, int subjectId, int? excludeGradeId = null, CancellationToken ct = default) =>
        DbSet.Where(n => n.StudentId == studentId
                         && n.SubjectId == subjectId
                         && (excludeGradeId == null || n.Id != excludeGradeId))
            .SumAsync(n => n.Percentage, ct);

    private IQueryable<Grade> WithDetails() =>
        DbSet.AsNoTracking()
            .Include(n => n.Student)
            .Include(n => n.Teacher)
            .Include(n => n.Subject);

    private static IQueryable<Grade> Filter(IQueryable<Grade> query, int? studentId, int? teacherId, int? subjectId)
    {
        if (studentId is not null) query = query.Where(n => n.StudentId == studentId);
        if (teacherId is not null) query = query.Where(n => n.TeacherId == teacherId);
        if (subjectId is not null) query = query.Where(n => n.SubjectId == subjectId);
        return query;
    }
}
