using Audisoft.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Audisoft.Infrastructure.Persistence.Configurations;

internal static class AuditableEntityConfiguration
{
    /// <summary>Filtro para índices únicos: permite reutilizar valores de registros borrados lógicamente.</summary>
    public const string NotDeletedFilter = "[IsDeleted] = 0";

    public static void ConfigureAudit<T>(this EntityTypeBuilder<T> builder) where T : AuditableEntity
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.CreatedAt).IsRequired().HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).IsRequired();
        builder.Property(e => e.DeletedAt).HasColumnType("datetime2");
    }
}
