using Audisoft.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Audisoft.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("Students");
        builder.ConfigureAudit();

        builder.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(e => e.LastName).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Email).IsRequired().HasMaxLength(150);
        builder.Property(e => e.StudentCode).IsRequired().HasMaxLength(20);
        builder.Property(e => e.EnrollmentDate).IsRequired().HasColumnType("datetime2");
        builder.Property(e => e.IsActive).IsRequired();

        builder.HasIndex(e => e.Email)
            .IsUnique()
            .HasFilter(AuditableEntityConfiguration.NotDeletedFilter)
            .HasDatabaseName("UX_Students_Email");

        builder.HasIndex(e => e.StudentCode)
            .IsUnique()
            .HasFilter(AuditableEntityConfiguration.NotDeletedFilter)
            .HasDatabaseName("UX_Students_StudentCode");
    }
}
