using Audisoft.Application.DTOs.Students;
using Audisoft.Application.Interfaces;
using Audisoft.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace Audisoft.Api.Controllers;

/// <summary>Gestión de estudiantes.</summary>
[ApiController]
[Route("api/students")]
[Produces("application/json")]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _service;

    public StudentsController(IStudentService service) => _service = service;

    /// <summary>Lista estudiantes paginados, con búsqueda, filtros por estado y rango de matrícula, y ordenamiento.</summary>
    /// <param name="query">
    /// search, isActive, enrolledFrom / enrolledTo (yyyy-MM-dd, incluidas), sortBy (name | code | enrollmentDate),
    /// sortDir (asc | desc), page (base 1) y pageSize (1–100).
    /// </param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<StudentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll([FromQuery] StudentQuery query, CancellationToken ct) =>
        Ok(await _service.GetPagedAsync(query, ct));

    /// <summary>Indicadores de matrícula: total, activos e inactivos.</summary>
    /// <remarks>Calculado en la base de datos; evita pedir varias páginas solo para contar.</remarks>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(StudentsSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct) => Ok(await _service.GetSummaryAsync(ct));

    /// <summary>Obtiene un estudiante por su id.</summary>
    /// <param name="id">Id del estudiante.</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(StudentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => Ok(await _service.GetByIdAsync(id, ct));

    /// <summary>Calcula el promedio ponderado del estudiante por asignatura y su promedio general.</summary>
    /// <remarks>
    /// Por asignatura: Σ(valor·porcentaje) / Σ(porcentaje). El promedio general pondera
    /// cada asignatura por sus créditos.
    /// </remarks>
    /// <param name="id">Id del estudiante.</param>
    /// <param name="subjectId">Opcional: limita el cálculo a una asignatura.</param>
    [HttpGet("{id:int}/average")]
    [ProducesResponseType(typeof(StudentAverageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAverage(int id, [FromQuery] int? subjectId, CancellationToken ct) =>
        Ok(await _service.GetAverageAsync(id, subjectId, ct));

    /// <summary>Matricula un estudiante.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(StudentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(CreateStudentDto dto, CancellationToken ct)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Actualiza un estudiante.</summary>
    /// <param name="id">Id del estudiante.</param>
    /// <param name="dto">Datos actualizados.</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(StudentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, UpdateStudentDto dto, CancellationToken ct) =>
        Ok(await _service.UpdateAsync(id, dto, ct));

    /// <summary>Elimina (lógicamente) un estudiante junto con sus notas.</summary>
    /// <param name="id">Id del estudiante.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
