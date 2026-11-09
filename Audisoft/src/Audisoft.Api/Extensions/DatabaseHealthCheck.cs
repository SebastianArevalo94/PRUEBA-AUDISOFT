using Audisoft.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Audisoft.Api.Extensions;

/// <summary>Verifica que la base de datos acepta conexiones (usado por GET /health).</summary>
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly ApplicationDbContext _context;

    public DatabaseHealthCheck(ApplicationDbContext context) => _context = context;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
        await _context.Database.CanConnectAsync(ct)
            ? HealthCheckResult.Healthy("Base de datos disponible.")
            : HealthCheckResult.Unhealthy("No fue posible conectar con la base de datos.");
}
