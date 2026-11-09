# Audisoft — API de Gestión Académica

Web API REST en **.NET 8** para gestionar profesores, estudiantes, asignaturas y notas,
construida con Clean Architecture, EF Core (Code-First) y SQL Server.

## Estructura

```
Audisoft.sln
└── src/
    ├── Audisoft.Domain          Entidades, AuditableEntity, interfaces de repositorio y IUnitOfWork (sin dependencias)
    ├── Audisoft.Application     DTOs, mapeos explícitos, servicios, reglas de negocio, excepciones
    ├── Audisoft.Infrastructure  ApplicationDbContext, Fluent API, migraciones, Repository<T>, UnitOfWork
    └── Audisoft.Api             Controllers, ExceptionHandlingMiddleware, Swagger, Program.cs
```

Dependencias: `Api → Application, Infrastructure` · `Infrastructure → Application, Domain` · `Application → Domain`.

## Puesta en marcha

```bash
docker compose up -d                      # SQL Server 2022 en localhost:1433 + esquema + datos de ejemplo
dotnet tool restore                       # dotnet-ef 8 (manifiesto local)
dotnet run --project src/Audisoft.Api     # en Development aplica las migraciones al iniciar
```

### Datos de ejemplo

`docker compose up -d` levanta SQL Server y luego el servicio `db-init` (se ejecuta y termina), que:

1. Crea la base `AudisoftAcademico` si no existe (`docker/sql/00-database.sql`).
2. Aplica el esquema (`docker/sql/01-schema.sql`, script idempotente generado desde las migraciones de EF Core;
   la API detecta la migración aplicada y no repite nada).
3. Si la base está **vacía**, inserta datos de ejemplo (`docker/sql/02-seed.sql`): 11 profesores, 16 asignaturas
   de ingeniería con créditos reales, 40 estudiantes y ~550 notas aleatorias que respetan las reglas de negocio
   (profesor titular, porcentaje acumulado ≤ 100%, valores 0.0–5.0). Incluye casos para probar el frontend:
   un profesor inactivo con asignatura a cargo, una profesora con notas pero sin asignaturas (no se puede eliminar),
   un profesor eliminable y 3 estudiantes inactivos.

Si la base ya tiene datos, la carga se omite. Para empezar de cero con los datos de ejemplo (**borra todo**):

```bash
docker compose down -v && docker compose up -d
docker compose logs db-init                 # "Carga inicial completada: …"
```

La migración `RenameSchemaToEnglish` renombra tablas, columnas, índices y restricciones al inglés con `sp_rename`
(sin borrar datos), así que una base existente se actualiza sola al iniciar la API.

Al agregar una migración nueva, regenera el script de esquema:

```bash
dotnet ef migrations script --idempotent -p src/Audisoft.Infrastructure -s src/Audisoft.Api -o docker/sql/01-schema.sql
```

Swagger UI: <http://localhost:5023/swagger> · Peticiones de ejemplo: `src/Audisoft.Api/Audisoft.Api.http`.

La cadena de conexión está en `src/Audisoft.Api/appsettings.json` (`ConnectionStrings:DefaultConnection`).
Para aplicar migraciones manualmente:

```bash
dotnet ef database update -p src/Audisoft.Infrastructure -s src/Audisoft.Api
```

## Endpoints

| Recurso      | Rutas |
|--------------|-------|
| Teachers     | `GET /api/teachers?search=&isActive=&registeredFrom=&registeredTo=&page=&pageSize=` · `GET /api/teachers/summary` · `POST /api/teachers` · `GET/PUT/DELETE /api/teachers/{id}` · `GET /api/teachers/{id}/subjects` |
| Students     | `GET /api/students?search=&isActive=&enrolledFrom=&enrolledTo=&sortBy=&sortDir=&page=&pageSize=` · `GET /api/students/summary` · `POST /api/students` · `GET/PUT/DELETE /api/students/{id}` · `GET /api/students/{id}/average?subjectId=` |
| Subjects     | `GET /api/subjects?search=&teacherId=&page=&pageSize=` · `GET /api/subjects/summary` · `POST /api/subjects` · `GET/PUT/DELETE /api/subjects/{id}` |
| Grades       | `GET /api/grades?studentId=&teacherId=&subjectId=&page=&pageSize=` · `GET /api/grades/summary?studentId=&teacherId=&subjectId=` · `POST /api/grades` · `GET/PUT/DELETE /api/grades/{id}` |

### Resúmenes y health check

- `GET /api/students/summary` → `{ total, active, inactive }`
- `GET /api/teachers/summary` → `{ total, active, inactive, subjects }`
- `GET /api/subjects/summary` → `{ total, totalCredits, teachersWithLoad, activeTeachers, withInactiveTeacher }`
- `GET /api/grades/summary?studentId=&teacherId=&subjectId=` → `{ total, average, passed, failed, passRate, subjectsGraded, studentsGraded, distribution }`.
  Acepta los mismos filtros que el listado. `average` es la media simple de los valores (no el promedio ponderado del
  estudiante, que está en `/students/{id}/average`); `distribution` agrupa las notas en `<2.0`, `2.0–2.9`, `3.0–3.9`,
  `4.0–4.7` y `4.8–5.0`.
- `GET /health` → `200 Healthy` si la base de datos acepta conexiones, `503 Unhealthy` si no.

Los indicadores se calculan en SQL (`COUNT`/`SUM`), sin traer filas a memoria, para que el frontend no
tenga que pedir varias páginas solo para contar.

### Paginación y búsqueda

Los cuatro listados (`GET` sin id) están paginados en el servidor: `page` (base 1, por defecto 1) y
`pageSize` (1–100, por defecto 10). Un valor fuera de rango devuelve `400`. Respuesta:

```json
{
  "items": [ ... ],
  "page": 3, "pageSize": 10, "totalCount": 25, "totalPages": 3,
  "hasPreviousPage": true, "hasNextPage": false
}
```

`search` no distingue mayúsculas ni tildes («gomez» encuentra «Gómez»).

Estudiantes admite además un rango de fecha de matrícula (`enrolledFrom` / `enrolledTo`, `yyyy-MM-dd`, ambas
incluidas; si la inicial es posterior a la final responde `400`) y ordenamiento con `sortBy` (`name` —apellido y
nombre, por defecto—, `code` o `enrollmentDate`) y `sortDir` (`asc` por defecto o `desc`).
Profesores admite el mismo tipo de rango sobre la fecha de registro (`registeredFrom` / `registeredTo`).
En ambos, un día puntual se consulta con la misma fecha en los dos extremos. Las notas se ordenan de la más
reciente a la más antigua; estudiantes y profesores, por apellido; asignaturas, por código.

### CORS

Los orígenes permitidos se configuran en `appsettings.json` → `Cors:AllowedOrigins`
(por defecto `http://localhost:4200`, el servidor de desarrollo de Angular). Las respuestas de error
también incluyen las cabeceras CORS, así el frontend puede leer el `ProblemDetails`.

## Reglas de negocio

- **Valor** de la nota entre 0.0 y 5.0 (DataAnnotations en el DTO, validación en `GradeService` y `CHECK` en BD).
- **Porcentaje** > 0 y ≤ 100; la suma de porcentajes de un estudiante en una asignatura no puede superar 100%.
- El profesor que registra la nota debe ser el **asignado a la asignatura**; estudiante y profesor deben estar activos.
- Email (profesor/estudiante), código estudiantil y código de asignatura son **únicos** (índices únicos filtrados por `IsDeleted = 0`).
- **Promedio** (`AverageCalculator`): por asignatura `Σ(valor·%) / Σ(%)` sobre lo evaluado, más la
  `AccumulatedGrade = Σ(valor·%) / 100`; el promedio general pondera cada asignatura por sus créditos.

## Borrado lógico y auditoría

Todas las entidades heredan de `AuditableEntity` (`CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`).
`ApplicationDbContext.SaveChangesAsync` completa las fechas y convierte cada `DELETE` en un `UPDATE IsDeleted = 1`;
un filtro global oculta los registros eliminados.

- Eliminar un **estudiante** o una **asignatura** elimina lógicamente sus notas.
- Eliminar un **profesor** con asignaturas o notas devuelve `409` (hay que reasignarlas primero).
- Todas las FK usan `ON DELETE NO ACTION`.

## Errores

Todas las respuestas de error usan **ProblemDetails** (RFC 7807) e incluyen `traceId`:

| Código | Causa |
|--------|-------|
| 400 | Validación del modelo (`ValidationProblemDetails`) |
| 404 | `NotFoundException` |
| 409 | `ConflictException` (duplicados, dependencias) o violación de restricción en BD |
| 422 | `BusinessRuleException` |
| 500 | Error no controlado (el detalle solo se expone en Development) |
