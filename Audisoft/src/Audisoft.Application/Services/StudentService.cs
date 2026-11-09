using Audisoft.Application.Common.Exceptions;
using Audisoft.Application.DTOs.Students;
using Audisoft.Application.Interfaces;
using Audisoft.Application.Mappings;
using Audisoft.Domain.Common;
using Audisoft.Domain.Entities;
using Audisoft.Domain.Interfaces;

namespace Audisoft.Application.Services;

public class StudentService : IStudentService
{
    private readonly IUnitOfWork _uow;

    public StudentService(IUnitOfWork uow) => _uow = uow;

    public async Task<PagedResult<StudentResponseDto>> GetPagedAsync(StudentQuery query, CancellationToken ct = default) =>
        (await _uow.Students.GetPagedAsync(query.ToFilter(), query.Page, query.PageSize, ct))
        .Map(e => e.ToDto());

    public async Task<StudentsSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var r = await _uow.Students.GetSummaryAsync(ct);
        return new StudentsSummaryDto(r.Total, r.Active, r.Total - r.Active);
    }

    public async Task<StudentResponseDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        (await GetStudentAsync(id, ct)).ToDto();

    public async Task<StudentAverageDto> GetAverageAsync(int id, int? subjectId = null, CancellationToken ct = default)
    {
        var student = await GetStudentAsync(id, ct);

        if (subjectId is not null && !await _uow.Subjects.AnyAsync(a => a.Id == subjectId, ct))
            throw new NotFoundException("Asignatura", subjectId);

        var grades = await _uow.Grades.GetFilteredAsync(id, null, subjectId, ct);
        return AverageCalculator.Calculate(student, grades);
    }

    public async Task<StudentResponseDto> CreateAsync(CreateStudentDto dto, CancellationToken ct = default)
    {
        var student = dto.ToEntity();
        await EnsureUniquenessAsync(student, null, ct);

        await _uow.Students.AddAsync(student, ct);
        await _uow.SaveChangesAsync(ct);
        return student.ToDto();
    }

    public async Task<StudentResponseDto> UpdateAsync(int id, UpdateStudentDto dto, CancellationToken ct = default)
    {
        var student = await GetStudentAsync(id, ct);

        dto.ApplyTo(student);
        await EnsureUniquenessAsync(student, id, ct);

        _uow.Students.Update(student);
        await _uow.SaveChangesAsync(ct);
        return student.ToDto();
    }

    /// <summary>Borrado lógico del estudiante y, en cascada, de sus notas.</summary>
    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var student = await GetStudentAsync(id, ct);

        foreach (var grade in await _uow.Grades.FindAsync(n => n.StudentId == id, ct))
            _uow.Grades.Remove(grade);

        _uow.Students.Remove(student);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<Student> GetStudentAsync(int id, CancellationToken ct) =>
        await _uow.Students.GetByIdAsync(id, ct) ?? throw new NotFoundException("Estudiante", id);

    private async Task EnsureUniquenessAsync(Student student, int? excludeId, CancellationToken ct)
    {
        if (await _uow.Students.ExistsByEmailAsync(student.Email, excludeId, ct))
            throw new ConflictException($"Ya existe un estudiante con el email '{student.Email}'.");

        if (await _uow.Students.ExistsByCodeAsync(student.StudentCode, excludeId, ct))
            throw new ConflictException($"Ya existe un estudiante con el código '{student.StudentCode}'.");
    }
}
