using Audisoft.Application.Common.Exceptions;
using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.DTOs.Teachers;
using Audisoft.Application.Interfaces;
using Audisoft.Application.Mappings;
using Audisoft.Domain.Common;
using Audisoft.Domain.Interfaces;

namespace Audisoft.Application.Services;

public class TeacherService : ITeacherService
{
    private readonly IUnitOfWork _uow;

    public TeacherService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<TeacherResponseDto>> GetPagedAsync(TeacherQuery query, CancellationToken ct = default) =>
        (await _uow.Teachers.GetPagedAsync(query.ToFilter(), query.Page, query.PageSize, ct))
        .Map(p => p.ToDto());

    public async Task<TeachersSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var r = await _uow.Teachers.GetSummaryAsync(ct);
        var subjects = await _uow.Subjects.CountAsync(_ => true, ct);
        return new TeachersSummaryDto(r.Total, r.Active, r.Total - r.Active, subjects);
    }

    public async Task<TeacherResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var teacher = await _uow.Teachers.GetByIdAsync(id, ct) ?? throw new NotFoundException("Profesor", id);
        return teacher.ToDto(await CountSubjectsAsync(id, ct));
    }

    public async Task<IReadOnlyList<SubjectResponseDto>> GetSubjectsAsync(int id, CancellationToken ct = default)
    {
        if (!await _uow.Teachers.AnyAsync(p => p.Id == id, ct))
            throw new NotFoundException("Profesor", id);

        var subjects = await _uow.Subjects.GetByTeacherAsync(id, ct);
        return subjects.Select(a => a.ToDto()).ToList();
    }

    public async Task<TeacherResponseDto> CreateAsync(CreateTeacherDto dto, CancellationToken ct = default)
    {
        var teacher = dto.ToEntity();
        await EnsureEmailAvailableAsync(teacher.Email, null, ct);

        await _uow.Teachers.AddAsync(teacher, ct);
        await _uow.SaveChangesAsync(ct);
        return teacher.ToDto(subjectCount: 0);
    }

    public async Task<TeacherResponseDto> UpdateAsync(int id, UpdateTeacherDto dto, CancellationToken ct = default)
    {
        var teacher = await _uow.Teachers.GetByIdAsync(id, ct) ?? throw new NotFoundException("Profesor", id);

        dto.ApplyTo(teacher);
        await EnsureEmailAvailableAsync(teacher.Email, id, ct);

        _uow.Teachers.Update(teacher);
        await _uow.SaveChangesAsync(ct);
        return teacher.ToDto(await CountSubjectsAsync(id, ct));
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var teacher = await _uow.Teachers.GetByIdAsync(id, ct) ?? throw new NotFoundException("Profesor", id);

        if (await _uow.Subjects.AnyAsync(a => a.TeacherId == id, ct))
            throw new ConflictException("No se puede eliminar el profesor porque tiene asignaturas a cargo. Reasígnelas primero.");

        if (await _uow.Grades.AnyAsync(n => n.TeacherId == id, ct))
            throw new ConflictException("No se puede eliminar el profesor porque tiene notas registradas.");

        _uow.Teachers.Remove(teacher);
        await _uow.SaveChangesAsync(ct);
    }

    private Task<int> CountSubjectsAsync(int teacherId, CancellationToken ct) =>
        _uow.Subjects.CountAsync(a => a.TeacherId == teacherId, ct);

    private async Task EnsureEmailAvailableAsync(string email, int? excludeId, CancellationToken ct)
    {
        if (await _uow.Teachers.ExistsByEmailAsync(email, excludeId, ct))
            throw new ConflictException($"Ya existe un profesor con el email '{email}'.");
    }
}
