using System.Linq.Expressions;
using Audisoft.Domain.Common;

namespace Audisoft.Domain.Interfaces;

public interface IRepository<T> where T : AuditableEntity
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);

    /// <summary>Marca la entidad para eliminación (el DbContext la convierte en borrado lógico).</summary>
    void Remove(T entity);
}
