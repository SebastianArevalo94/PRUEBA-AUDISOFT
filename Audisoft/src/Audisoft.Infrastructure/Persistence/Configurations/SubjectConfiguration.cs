using Audisoft.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Audisoft.Infrastructure.Persistence.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("Subjects", t =>
            t.HasCheckConstraint("CK_Subjects_Credits", "[Credits] > 0"));
        builder.ConfigureAudit();

        builder.Property(a => a.Name).IsRequired().HasMaxLength(150);
        builder.Property(a => a.Code).IsRequired().HasMaxLength(20);
        builder.Property(a => a.Credits).IsRequired();

        builder.HasIndex(a => a.Code)
            .IsUnique()
            .HasFilter(AuditableEntityConfiguration.NotDeletedFilter)
            .HasDatabaseName("UX_Subjects_Code");

        builder.HasOne(a => a.Teacher)
            .WithMany(p => p.Subjects)
            .HasForeignKey(a => a.TeacherId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_Subjects_Teachers_TeacherId");
    }
}
