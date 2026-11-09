using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.DTOs.Students;
using Audisoft.Application.DTOs.Grades;
using Audisoft.Application.DTOs.Teachers;
using Audisoft.Domain.Common;

namespace Audisoft.Application.Interfaces;

public interface ITeacherService
{
    Task<PagedResult<TeacherResponseDto>> GetPagedAsync(TeacherQuery query, CancellationToken ct = default);
    Task<TeachersSummaryDto> GetSummaryAsync(CancellationToken ct = default);
    Task<TeacherResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<SubjectResponseDto>> GetSubjectsAsync(int id, CancellationToken ct = default);
    Task<TeacherResponseDto> CreateAsync(CreateTeacherDto dto, CancellationToken ct = default);
    Task<TeacherResponseDto> UpdateAsync(int id, UpdateTeacherDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IStudentService
{
    Task<PagedResult<StudentResponseDto>> GetPagedAsync(StudentQuery query, CancellationToken ct = default);
    Task<StudentsSummaryDto> GetSummaryAsync(CancellationToken ct = default);
    Task<StudentResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<StudentAverageDto> GetAverageAsync(int id, int? subjectId = null, CancellationToken ct = default);
    Task<StudentResponseDto> CreateAsync(CreateStudentDto dto, CancellationToken ct = default);
    Task<StudentResponseDto> UpdateAsync(int id, UpdateStudentDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface ISubjectService
{
    Task<PagedResult<SubjectResponseDto>> GetPagedAsync(SubjectQuery query, CancellationToken ct = default);
    Task<SubjectsSummaryDto> GetSummaryAsync(CancellationToken ct = default);
    Task<SubjectResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<SubjectResponseDto> CreateAsync(CreateSubjectDto dto, CancellationToken ct = default);
    Task<SubjectResponseDto> UpdateAsync(int id, UpdateSubjectDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IGradeService
{
    Task<PagedResult<GradeDetailDto>> GetPagedAsync(GradeQuery query, CancellationToken ct = default);
    Task<GradesSummaryDto> GetSummaryAsync(GradeSummaryQuery query, CancellationToken ct = default);
    Task<GradeDetailDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<GradeDetailDto> CreateAsync(CreateGradeDto dto, CancellationToken ct = default);
    Task<GradeDetailDto> UpdateAsync(int id, UpdateGradeDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
