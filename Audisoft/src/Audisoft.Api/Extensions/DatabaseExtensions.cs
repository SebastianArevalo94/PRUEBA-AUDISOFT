using Audisoft.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Audisoft.Api.Extensions;

public static class DatabaseExtensions
{
    /// <summary>Aplica las migraciones pendientes (habilitado por configuración: Database:ApplyMigrationsOnStartup).</summary>
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
        if (pending.Count == 0) return;

        logger.LogInformation("Aplicando {Count} migración(es): {Migrations}", pending.Count, pending);
        await db.Database.MigrateAsync();
    }
}
