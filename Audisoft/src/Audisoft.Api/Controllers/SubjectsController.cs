using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.Interfaces;
using Audisoft.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Audisoft.Api.Controllers;

/// <summary>Gestión de asignaturas.</summary>
[ApiController]
[Route("api/subjects")]
[Produces("application/json")]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _service;

    public SubjectsController(ISubjectService service) => _service = service;

    /// <summary>Lista asignaturas paginadas con su profesor, con búsqueda y filtro por profesor.</summary>
    /// <param name="query">search, teacherId, sortBy (code | name), sortDir (asc | desc), page (base 1) y pageSize (1–100).</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromQuery] SubjectQuery query, CancellationToken ct) =>
        Ok(await _service.GetPagedAsync(query, ct));

    /// <summary>Indicadores del catálogo: total, créditos, cobertura docente y asignaturas con docente inactivo.</summary>
    /// <remarks>Calculado en la base de datos; evita pedir varias páginas solo para contar.</remarks>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(SubjectsSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct) => Ok(await _service.GetSummaryAsync(ct));

    /// <summary>Obtiene una asignatura por su id.</summary>
    /// <param name="id">Id de la asignatura.</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SubjectResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    /// <summary>Crea una asignatura asignada a un profesor activo.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SubjectResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create(CreateSubjectDto dto, CancellationToken ct)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Actualiza una asignatura.</summary>
    /// <param name="id">Id de la asignatura.</param>
    /// <param name="dto">Datos actualizados.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SubjectResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Update(int id, UpdateSubjectDto dto, CancellationToken ct) =>
        Ok(await _service.UpdateAsync(id, dto, ct));

    /// <summary>Elimina (lógicamente) una asignatura junto con sus notas.</summary>
    /// <param name="id">Id de la asignatura.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
