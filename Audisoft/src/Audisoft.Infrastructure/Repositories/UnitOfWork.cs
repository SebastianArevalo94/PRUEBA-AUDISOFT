using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;

namespace Audisoft.Infrastructure.Repositories;

/// <summary>
/// Agrupa los repositorios sobre un mismo <see cref="ApplicationDbContext"/> para que
/// todos los cambios de una operación se confirmen en una única transacción.
/// </summary>
public sealed class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private ITeacherRepository? _teachers;
    private IStudentRepository? _students;
    private ISubjectRepository? _subjects;
    private IGradeRepository? _grades;

    public UnitOfWork(ApplicationDbContext context) => _context = context;

    public ITeacherRepository Teachers => _teachers ??= new TeacherRepository(_context);
    public IStudentRepository Students => _students ??= new StudentRepository(_context);
    public ISubjectRepository Subjects => _subjects ??= new SubjectRepository(_context);
    public IGradeRepository Grades => _grades ??= new GradeRepository(_context);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    public void Dispose() => _context.Dispose();
}
