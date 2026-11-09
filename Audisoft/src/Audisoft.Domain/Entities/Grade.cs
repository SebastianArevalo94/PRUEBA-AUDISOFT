using Audisoft.Domain.Common;

namespace Audisoft.Domain.Entities;

public class Grade : AuditableEntity
{
    public const decimal MinValue = 0.0m;
    public const decimal MaxValue = 5.0m;
    public const decimal MaxPercentagePerSubject = 100.0m;

    /// <summary>Nota mínima para aprobar (escala 0.0–5.0).</summary>
    public const decimal PassingGrade = 3.0m;

    /// <summary>Límites de los rangos del histograma: [0, 2.0), [2.0, 3.0), [3.0, 4.0), [4.0, 4.8), [4.8, 5.0].</summary>
    public static readonly decimal[] DistributionBounds = [2.0m, 3.0m, 4.0m, 4.8m];

    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal Percentage { get; set; }
    public DateTime RecordedAt { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public static bool IsValidValue(decimal value) => value >= MinValue && value <= MaxValue;

    public static bool IsValidPercentage(decimal percentage) =>
        percentage > 0 && percentage <= MaxPercentagePerSubject;
}
