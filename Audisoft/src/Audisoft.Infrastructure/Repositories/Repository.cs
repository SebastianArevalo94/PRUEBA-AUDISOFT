using System.Linq.Expressions;
using Audisoft.Domain.Common;
using Audisoft.Domain.Interfaces;
using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : AuditableEntity
{
    /// <summary>Collation para búsquedas sin distinguir mayúsculas ni tildes ("gomez" encuentra "Gómez").</summary>
    protected const string SearchCollation = "Latin1_General_CI_AI";

    protected readonly ApplicationDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(ApplicationDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual Task<T?> GetByIdAsync(int id, CancellationToken ct = default) =>
        DbSet.FirstOrDefaultAsync(e => e.Id == id, ct);

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default) =>
        await DbSet.AsNoTracking().OrderBy(e => e.Id).ToListAsync(ct);

    public virtual async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await DbSet.Where(predicate).ToListAsync(ct);

    public virtual Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        DbSet.AnyAsync(predicate, ct);

    public virtual Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        DbSet.CountAsync(predicate, ct);

    public virtual async Task AddAsync(T entity, CancellationToken ct = default) =>
        await DbSet.AddAsync(entity, ct);

    public virtual void Update(T entity) => DbSet.Update(entity);

    public virtual void Remove(T entity) => DbSet.Remove(entity);

    /// <summary>Ejecuta la consulta ya filtrada y ordenada devolviendo solo la página solicitada.</summary>
    protected static async Task<PagedResult<TEntity>> ToPagedAsync<TEntity>(
        IQueryable<TEntity> query, int page, int pageSize, CancellationToken ct)
    {
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TEntity>(items, page, pageSize, total);
    }
}
