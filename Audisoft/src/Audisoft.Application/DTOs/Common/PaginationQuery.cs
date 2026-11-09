using System.ComponentModel.DataAnnotations;

namespace Audisoft.Application.DTOs.Common;

/// <summary>Parámetros de paginación comunes a todos los listados.</summary>
public record PaginationQuery
{
    public const int MaxPageSize = 100;

    /// <summary>Número de página (base 1).</summary>
    /// <example>1</example>
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    /// <summary>Registros por página (máximo 100).</summary>
    /// <example>10</example>
    [Range(1, MaxPageSize)]
    public int PageSize { get; init; } = 10;
}
