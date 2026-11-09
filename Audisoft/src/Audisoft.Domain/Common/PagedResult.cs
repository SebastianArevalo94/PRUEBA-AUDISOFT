namespace Audisoft.Domain.Common;

/// <summary>Página de resultados con la información necesaria para construir un paginador.</summary>
/// <param name="Items">Elementos de la página actual.</param>
/// <param name="Page">Número de página (base 1).</param>
/// <param name="PageSize">Tamaño de página solicitado.</param>
/// <param name="TotalCount">Total de registros que cumplen los filtros.</param>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    /// <summary>Total de páginas disponibles.</summary>
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// <summary>Indica si existe una página anterior.</summary>
    public bool HasPreviousPage => Page > 1;

    /// <summary>Indica si existe una página siguiente.</summary>
    public bool HasNextPage => Page < TotalPages;

    public PagedResult<TOut> Map<TOut>(Func<T, TOut> map) =>
        new(Items.Select(map).ToList(), Page, PageSize, TotalCount);
}
