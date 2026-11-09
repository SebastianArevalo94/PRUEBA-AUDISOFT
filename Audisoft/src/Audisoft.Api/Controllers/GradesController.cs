using Audisoft.Application.DTOs.Grades;
using Audisoft.Application.Interfaces;
using Audisoft.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Audisoft.Api.Controllers;

/// <summary>Registro y consulta de notas.</summary>
[ApiController]
[Route("api/grades")]
[Produces("application/json")]
public class GradesController : ControllerBase
{
    private readonly IGradeService _service;

    public GradesController(IGradeService service) => _service = service;

    /// <summary>Lista notas paginadas (más recientes primero), filtrables por estudiante, profesor y/o asignatura.</summary>
    /// <param name="query">studentId, teacherId, subjectId, page (base 1) y pageSize (1–100).</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<GradeDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromQuery] GradeQuery query, CancellationToken ct) =>
        Ok(await _service.GetPagedAsync(query, ct));

    /// <summary>Indicadores de las notas filtradas: promedio, tasa de aprobación, reprobadas y distribución por rangos.</summary>
    /// <remarks>Acepta los mismos filtros que el listado. Calculado en la base de datos en una sola consulta de agregados.</remarks>
    /// <param name="query">studentId, teacherId y/o subjectId.</param>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(GradesSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] GradeSummaryQuery query, CancellationToken ct) =>
        Ok(await _service.GetSummaryAsync(query, ct));

    /// <summary>Obtiene el detalle de una nota.</summary>
    /// <param name="id">Id de la nota.</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(GradeDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    /// <summary>Registra una nota.</summary>
    /// <remarks>
    /// Reglas: valor entre 0.0 y 5.0; el profesor debe ser el asignado a la asignatura;
    /// estudiante y profesor deben estar activos; la suma de porcentajes del estudiante
    /// en la asignatura no puede superar 100%.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(GradeDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(CreateGradeDto dto, CancellationToken ct)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Corrige nombre, valor o porcentaje de una nota.</summary>
    /// <param name="id">Id de la nota.</param>
    /// <param name="dto">Datos actualizados.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(GradeDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(int id, UpdateGradeDto dto, CancellationToken ct) =>
        Ok(await _service.UpdateAsync(id, dto, ct));

    /// <summary>Elimina (lógicamente) una nota.</summary>
    /// <param name="id">Id de la nota.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
