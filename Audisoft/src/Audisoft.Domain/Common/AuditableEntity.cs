namespace Audisoft.Domain.Common;

/// <summary>
/// Base para todas las entidades persistidas: clave primaria, auditoría y borrado lógico.
/// Los campos de auditoría los completa el DbContext al guardar cambios.
/// </summary>
public abstract class AuditableEntity
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
