using Audisoft.Application.DTOs.Subjects;
using Audisoft.Application.DTOs.Teachers;
using Audisoft.Application.Interfaces;
using Audisoft.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Audisoft.Api.Controllers;

/// <summary>Gestión de profesores.</summary>
[ApiController]
[Route("api/teachers")]
[Produces("application/json")]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _service;

    public TeachersController(ITeacherService service) => _service = service;

    /// <summary>Lista profesores paginados, con búsqueda, filtros por estado, fecha de registro y carga docente, y ordenamiento.</summary>
    /// <param name="query">
    /// search, isActive, registeredFrom / registeredTo (yyyy-MM-dd, incluidas), hasSubjects (true | false), sortBy (name | createdAt),
    /// sortDir (asc | desc), page (base 1) y pageSize (1–100).
    /// </param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TeacherResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromQuery] TeacherQuery query, CancellationToken ct) =>
        Ok(await _service.GetPagedAsync(query, ct));

    /// <summary>Indicadores del cuerpo docente: total, activos, inactivos y asignaturas registradas.</summary>
    /// <remarks>Calculado en la base de datos; evita pedir varias páginas solo para contar.</remarks>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(TeachersSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct) => Ok(await _service.GetSummaryAsync(ct));

    /// <summary>Obtiene un profesor por su id.</summary>
    /// <param name="id">Id del profesor.</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TeacherResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    /// <summary>Lista las asignaturas a cargo de un profesor.</summary>
    /// <param name="id">Id del profesor.</param>
    [HttpGet("{id:int}/subjects")]
    [ProducesResponseType(typeof(IReadOnlyList<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubjects(int id, CancellationToken ct) =>
        Ok(await _service.GetSubjectsAsync(id, ct));

    /// <summary>Registra un profesor.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TeacherResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(CreateTeacherDto dto, CancellationToken ct)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Actualiza un profesor.</summary>
    /// <param name="id">Id del profesor.</param>
    /// <param name="dto">Datos actualizados.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TeacherResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, UpdateTeacherDto dto, CancellationToken ct) =>
        Ok(await _service.UpdateAsync(id, dto, ct));

    /// <summary>Elimina (lógicamente) un profesor. Falla si tiene asignaturas o notas asociadas.</summary>
    /// <param name="id">Id del profesor.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
