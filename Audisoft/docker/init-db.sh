#!/bin/bash
# Inicializa la base de datos: crea la BD, aplica el esquema (script idempotente generado desde las
# migraciones de EF Core) e inserta los datos de ejemplo solo si la base está vacía.
set -euo pipefail

SQLCMD=/opt/mssql-tools18/bin/sqlcmd
# -I: QUOTED_IDENTIFIER ON (lo exigen los índices únicos filtrados del esquema).
ARGS=(-S "${DB_HOST:-sqlserver}" -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -f 65001)

echo "==> Esperando a SQL Server..."
for i in $(seq 1 60); do
  if "$SQLCMD" "${ARGS[@]}" -Q "SELECT 1" -h -1 >/dev/null 2>&1; then break; fi
  [ "$i" -eq 60 ] && { echo "SQL Server no respondió a tiempo." >&2; exit 1; }
  sleep 2
done

echo "==> Base de datos"
"$SQLCMD" "${ARGS[@]}" -i /sql/00-database.sql
echo "==> Esquema (migraciones de EF Core)"
"$SQLCMD" "${ARGS[@]}" -d AudisoftAcademico -i /sql/01-schema.sql
echo "==> Datos de ejemplo"
"$SQLCMD" "${ARGS[@]}" -d AudisoftAcademico -i /sql/02-seed.sql
echo "==> Listo"
