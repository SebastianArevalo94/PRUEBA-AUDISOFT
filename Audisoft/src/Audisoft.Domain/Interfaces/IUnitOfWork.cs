namespace Audisoft.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    ITeacherRepository Teachers { get; }
    IStudentRepository Students { get; }
    ISubjectRepository Subjects { get; }
    IGradeRepository Grades { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
