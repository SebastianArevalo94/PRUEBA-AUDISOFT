using Audisoft.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Audisoft.Infrastructure.Persistence.Configurations;

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.ToTable("Grades", t =>
        {
            t.HasCheckConstraint("CK_Grades_Value", "[Value] >= 0.0 AND [Value] <= 5.0");
            t.HasCheckConstraint("CK_Grades_Percentage", "[Percentage] > 0 AND [Percentage] <= 100");
        });
        builder.ConfigureAudit();

        builder.Property(n => n.Name).IsRequired().HasMaxLength(100);
        builder.Property(n => n.Value).IsRequired().HasPrecision(4, 2);
        builder.Property(n => n.Percentage).IsRequired().HasPrecision(5, 2);
        builder.Property(n => n.RecordedAt).IsRequired().HasColumnType("datetime2");

        // Restrict en todas las FK: SQL Server no admite múltiples rutas de cascada
        // (Profesor -> Asignatura -> Nota y Profesor -> Nota) y el borrado es lógico.
        builder.HasOne(n => n.Student)
            .WithMany(e => e.Grades)
            .HasForeignKey(n => n.StudentId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_Grades_Students_StudentId");

        builder.HasOne(n => n.Teacher)
            .WithMany(p => p.Grades)
            .HasForeignKey(n => n.TeacherId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_Grades_Teachers_TeacherId");

        builder.HasOne(n => n.Subject)
            .WithMany(a => a.Grades)
            .HasForeignKey(n => n.SubjectId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_Grades_Subjects_SubjectId");

        // Índice compuesto para el cálculo de promedios y la validación del porcentaje acumulado.
        builder.HasIndex(n => new { n.StudentId, n.SubjectId })
            .HasDatabaseName("IX_Grades_StudentId_SubjectId");
    }
}
