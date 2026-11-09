using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.DTOs.Students;
using Audisoft.Application.DTOs.Grades;
using Audisoft.Application.DTOs.Teachers;
using Audisoft.Domain.Entities;

namespace Audisoft.Application.Mappings;

/// <summary>Mapeos explícitos entre entidades de dominio y DTOs.</summary>
public static class MappingExtensions
{
    // ---------- Profesor ----------
    /// <param name="p">Profesor.</param>
    /// <param name="subjectCount">Si se omite, se cuentan las asignaturas cargadas en la entidad.</param>
    public static TeacherResponseDto ToDto(this Teacher p, int? subjectCount = null) =>
        new(p.Id, p.FirstName, p.LastName, p.Email, p.CreatedAt, p.IsActive,
            subjectCount ?? p.Subjects.Count);

    public static Teacher ToEntity(this CreateTeacherDto dto) => new()
    {
        FirstName = dto.FirstName.Trim(),
        LastName = dto.LastName.Trim(),
        Email = NormalizeEmail(dto.Email),
        IsActive = true
    };

    public static void ApplyTo(this UpdateTeacherDto dto, Teacher p)
    {
        p.FirstName = dto.FirstName.Trim();
        p.LastName = dto.LastName.Trim();
        p.Email = NormalizeEmail(dto.Email);
        p.IsActive = dto.IsActive;
    }

    // ---------- Estudiante ----------
    public static StudentResponseDto ToDto(this Student e) =>
        new(e.Id, e.FirstName, e.LastName, e.Email, e.StudentCode, e.EnrollmentDate, e.IsActive);

    public static Student ToEntity(this CreateStudentDto dto) => new()
    {
        FirstName = dto.FirstName.Trim(),
        LastName = dto.LastName.Trim(),
        Email = NormalizeEmail(dto.Email),
        StudentCode = NormalizeCode(dto.StudentCode),
        EnrollmentDate = dto.EnrollmentDate ?? DateTime.UtcNow,
        IsActive = true
    };

    public static void ApplyTo(this UpdateStudentDto dto, Student e)
    {
        e.FirstName = dto.FirstName.Trim();
        e.LastName = dto.LastName.Trim();
        e.Email = NormalizeEmail(dto.Email);
        e.StudentCode = NormalizeCode(dto.StudentCode);
        e.EnrollmentDate = dto.EnrollmentDate ?? e.EnrollmentDate;
        e.IsActive = dto.IsActive;
    }

    // ---------- Asignatura ----------
    public static SubjectResponseDto ToDto(this Subject a) =>
        new(a.Id, a.Name, a.Code, a.Credits, a.TeacherId,
            a.Teacher is null ? null : FullName(a.Teacher.FirstName, a.Teacher.LastName));

    public static Subject ToEntity(this CreateSubjectDto dto) => new()
    {
        Name = dto.Name.Trim(),
        Code = NormalizeCode(dto.Code),
        Credits = dto.Credits,
        TeacherId = dto.TeacherId
    };

    public static void ApplyTo(this UpdateSubjectDto dto, Subject a)
    {
        a.Name = dto.Name.Trim();
        a.Code = NormalizeCode(dto.Code);
        a.Credits = dto.Credits;
        a.TeacherId = dto.TeacherId;
    }

    // ---------- Nota ----------
    public static GradeDetailDto ToDetailDto(this Grade n) => new(
        n.Id, n.Name, n.Value, n.Percentage, n.RecordedAt,
        n.StudentId, FullName(n.Student.FirstName, n.Student.LastName), n.Student.StudentCode,
        n.TeacherId, FullName(n.Teacher.FirstName, n.Teacher.LastName),
        n.SubjectId, n.Subject.Code, n.Subject.Name);

    public static Grade ToEntity(this CreateGradeDto dto) => new()
    {
        Name = dto.Name.Trim(),
        Value = dto.Value,
        Percentage = dto.Percentage,
        StudentId = dto.StudentId,
        TeacherId = dto.TeacherId,
        SubjectId = dto.SubjectId,
        RecordedAt = DateTime.UtcNow
    };

    public static void ApplyTo(this UpdateGradeDto dto, Grade n)
    {
        n.Name = dto.Name.Trim();
        n.Value = dto.Value;
        n.Percentage = dto.Percentage;
    }

    // ---------- Helpers ----------
    public static string FullName(string firstName, string lastName) => $"{firstName} {lastName}";

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
}
