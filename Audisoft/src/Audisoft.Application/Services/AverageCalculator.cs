using Audisoft.Application.DTOs.Students;
using Audisoft.Application.Mappings;
using Audisoft.Domain.Entities;

namespace Audisoft.Application.Services;

/// <summary>Cálculo del promedio ponderado de un estudiante.</summary>
public static class AverageCalculator
{
    private const int Decimals = 2;

    /// <summary>
    /// Por asignatura: PromedioPonderado = Σ(valor·porcentaje) / Σ(porcentaje) y
    /// NotaAcumulada = Σ(valor·porcentaje) / 100.
    /// General: promedio de los PromedioPonderado de cada asignatura ponderado por créditos.
    /// </summary>
    /// <param name="student">Estudiante evaluado.</param>
    /// <param name="grades">Notas del estudiante con la asignatura cargada.</param>
    public static StudentAverageDto Calculate(Student student, IEnumerable<Grade> grades)
    {
        var subjects = grades
            .GroupBy(n => n.SubjectId)
            .Select(g =>
            {
                var subject = g.First().Subject;
                var percentageSum = g.Sum(n => n.Percentage);
                var weightedSum = g.Sum(n => n.Value * n.Percentage);

                return new SubjectAverageDto(
                    subject.Id,
                    subject.Code,
                    subject.Name,
                    subject.Credits,
                    g.Count(),
                    percentageSum,
                    Round(percentageSum == 0 ? 0 : weightedSum / percentageSum),
                    Round(weightedSum / Grade.MaxPercentagePerSubject));
            })
            .OrderBy(a => a.Code)
            .ToList();

        var totalCredits = subjects.Sum(a => a.Credits);
        decimal? overallAverage = totalCredits == 0
            ? null
            : Round(subjects.Sum(a => a.WeightedAverage * a.Credits) / totalCredits);

        return new StudentAverageDto(
            student.Id,
            MappingExtensions.FullName(student.FirstName, student.LastName),
            student.StudentCode,
            overallAverage,
            subjects);
    }

    private static decimal Round(decimal value) =>
        Math.Round(value, Decimals, MidpointRounding.AwayFromZero);
}
