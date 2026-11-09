using Audisoft.Domain.Common;

namespace Audisoft.Domain.Entities;

public class Subject : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int Credits { get; set; }

    public int TeacherId { get; set; }
    public Teacher Teacher { get; set; } = null!;

    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
