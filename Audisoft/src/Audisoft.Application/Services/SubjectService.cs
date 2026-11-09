using Audisoft.Application.Common.Exceptions;
using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.Interfaces;
using Audisoft.Application.Mappings;
using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;

namespace Audisoft.Application.Services;

public class SubjectService : ISubjectService
{
    private readonly IUnitOfWork _uow;

    public SubjectService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<SubjectResponseDto>> GetPagedAsync(SubjectQuery query, CancellationToken ct = default) =>
        (await _uow.Subjects.GetPagedAsync(
            query.Search, query.TeacherId, query.SortBy, query.SortDir, query.Page, query.PageSize, ct))
        .Map(a => a.ToDto());

    public async Task<SubjectsSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var r = await _uow.Subjects.GetSummaryAsync(ct);
        return new SubjectsSummaryDto(r.Total, r.TotalCredits, r.TeachersWithLoad, r.ActiveTeachers, r.WithInactiveTeacher);
    }

    public async Task<SubjectResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var subject = await _uow.Subjects.GetWithTeacherAsync(id, ct)
                         ?? throw new NotFoundException("Asignatura", id);
        return subject.ToDto();
    }

    public async Task<SubjectResponseDto> CreateAsync(CreateSubjectDto dto, CancellationToken ct = default)
    {
        var subject = dto.ToEntity();
        await ValidateAsync(subject, null, ct);

        await _uow.Subjects.AddAsync(subject, ct);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(subject.Id, ct);
    }

    public async Task<SubjectResponseDto> UpdateAsync(int id, UpdateSubjectDto dto, CancellationToken ct = default)
    {
        var subject = await _uow.Subjects.GetByIdAsync(id, ct) ?? throw new NotFoundException("Asignatura", id);

        dto.ApplyTo(subject);
        await ValidateAsync(subject, id, ct);

        _uow.Subjects.Update(subject);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    /// <summary>Borrado lógico de la asignatura y, en cascada, de sus notas.</summary>
    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var subject = await _uow.Subjects.GetByIdAsync(id, ct) ?? throw new NotFoundException("Asignatura", id);

        foreach (var grade in await _uow.Grades.FindAsync(n => n.SubjectId == id, ct))
            _uow.Grades.Remove(grade);

        _uow.Subjects.Remove(subject);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task ValidateAsync(Subject subject, int? excludeId, CancellationToken ct)
    {
        var teacher = await _uow.Teachers.GetByIdAsync(subject.TeacherId, ct)
                       ?? throw new NotFoundException("Profesor", subject.TeacherId);

        if (!teacher.IsActive)
            throw new BusinessRuleException($"El profesor '{teacher.Id}' está inactivo y no puede tener asignaturas a cargo.");

        if (await _uow.Subjects.ExistsByCodeAsync(subject.Code, excludeId, ct))
            throw new ConflictException($"Ya existe una asignatura con el código '{subject.Code}'.");
    }
}
