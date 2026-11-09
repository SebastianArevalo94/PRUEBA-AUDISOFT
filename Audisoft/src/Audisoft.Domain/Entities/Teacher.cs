using Audisoft.Domain.Common;

namespace Audisoft.Domain.Entities;

public class Teacher : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
