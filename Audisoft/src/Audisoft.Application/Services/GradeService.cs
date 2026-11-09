using Audisoft.Application.Common.Exceptions;
using Audisoft.Application.DTOs.Grades;
using Audisoft.Application.Interfaces;
using Audisoft.Application.Mappings;
using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;

namespace Audisoft.Application.Services;

public class GradeService : IGradeService
{
    private readonly IUnitOfWork _uow;

    public GradeService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<GradeDetailDto>> GetPagedAsync(GradeQuery query, CancellationToken ct = default) =>
        (await _uow.Grades.GetPagedAsync(
            query.StudentId, query.TeacherId, query.SubjectId, query.Page, query.PageSize, ct))
        .Map(n => n.ToDetailDto());

    public async Task<GradesSummaryDto> GetSummaryAsync(GradeSummaryQuery query, CancellationToken ct = default)
    {
        var r = await _uow.Grades.GetSummaryAsync(query.StudentId, query.TeacherId, query.SubjectId, ct);

        // Rangos: [0, l1), [l1, l2), …, [lN, 5.0]. La etiqueta usa un decimal ("2.0–2.9").
        var bounds = new[] { Grade.MinValue }.Concat(Grade.DistributionBounds).Append(Grade.MaxValue).ToArray();
        var distribution = r.Distribution
            .Select((count, i) =>
            {
                var (lowerBound, upperBound) = (bounds[i], bounds[i + 1]);
                var isLast = i == r.Distribution.Count - 1;
                var label = i == 0 ? $"<{upperBound:0.0}" : $"{lowerBound:0.0}–{(isLast ? upperBound : upperBound - 0.1m):0.0}";
                return new GradeRangeDto(label, lowerBound, upperBound, count);
            })
            .ToList();

        return new GradesSummaryDto(
            r.Total,
            r.Average is null ? null : Math.Round(r.Average.Value, 2),
            r.Passed,
            r.Total - r.Passed,
            r.Total == 0 ? null : Math.Round(r.Passed * 100m / r.Total, 1),
            r.SubjectsGraded,
            r.StudentsGraded,
            distribution);
    }

    public async Task<GradeDetailDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var grade = await _uow.Grades.GetDetailAsync(id, ct) ?? throw new NotFoundException("Nota", id);
        return grade.ToDetailDto();
    }

    public async Task<GradeDetailDto> CreateAsync(CreateGradeDto dto, CancellationToken ct = default)
    {
        ValidateValueAndPercentage(dto.Value, dto.Percentage);

        var student = await _uow.Students.GetByIdAsync(dto.StudentId, ct)
                         ?? throw new NotFoundException("Estudiante", dto.StudentId);
        if (!student.IsActive)
            throw new BusinessRuleException("No se pueden registrar notas a un estudiante inactivo.");

        var teacher = await _uow.Teachers.GetByIdAsync(dto.TeacherId, ct)
                       ?? throw new NotFoundException("Profesor", dto.TeacherId);
        if (!teacher.IsActive)
            throw new BusinessRuleException("Un profesor inactivo no puede registrar notas.");

        var subject = await _uow.Subjects.GetByIdAsync(dto.SubjectId, ct)
                         ?? throw new NotFoundException("Asignatura", dto.SubjectId);
        if (subject.TeacherId != teacher.Id)
            throw new BusinessRuleException(
                $"El profesor '{teacher.Id}' no está asignado a la asignatura '{subject.Code}'.");

        await ValidateAccumulatedPercentageAsync(dto.StudentId, dto.SubjectId, dto.Percentage, null, ct);

        var grade = dto.ToEntity();
        await _uow.Grades.AddAsync(grade, ct);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(grade.Id, ct);
    }

    public async Task<GradeDetailDto> UpdateAsync(int id, UpdateGradeDto dto, CancellationToken ct = default)
    {
        ValidateValueAndPercentage(dto.Value, dto.Percentage);

        var grade = await _uow.Grades.GetByIdAsync(id, ct) ?? throw new NotFoundException("Nota", id);
        await ValidateAccumulatedPercentageAsync(grade.StudentId, grade.SubjectId, dto.Percentage, id, ct);

        dto.ApplyTo(grade);
        _uow.Grades.Update(grade);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var grade = await _uow.Grades.GetByIdAsync(id, ct) ?? throw new NotFoundException("Nota", id);
        _uow.Grades.Remove(grade);
        await _uow.SaveChangesAsync(ct);
    }

    private static void ValidateValueAndPercentage(decimal value, decimal percentage)
    {
        if (!Grade.IsValidValue(value))
            throw new BusinessRuleException(
                $"El valor de la nota debe estar entre {Grade.MinValue:0.0} y {Grade.MaxValue:0.0}.");

        if (!Grade.IsValidPercentage(percentage))
            throw new BusinessRuleException(
                $"El porcentaje debe ser mayor que 0 y no superar {Grade.MaxPercentagePerSubject:0}.");
    }

    /// <summary>La suma de porcentajes de un estudiante en una asignatura no puede superar el 100%.</summary>
    private async Task ValidateAccumulatedPercentageAsync(
        int studentId, int subjectId, decimal percentage, int? excludeGradeId, CancellationToken ct)
    {
        var accumulated = await _uow.Grades.SumPercentageAsync(studentId, subjectId, excludeGradeId, ct);
        if (accumulated + percentage > Grade.MaxPercentagePerSubject)
            throw new BusinessRuleException(
                $"El porcentaje acumulado superaría el {Grade.MaxPercentagePerSubject:0}% " +
                $"(registrado: {accumulated:0.##}%, disponible: {Grade.MaxPercentagePerSubject - accumulated:0.##}%).");
    }
}
