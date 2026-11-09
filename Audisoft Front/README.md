# Gestión Académica — Frontend (Angular)

Interfaz web que consume la API REST de gestión académica (.NET 8, repo `Audisoft`).
Diseño generado con Google Stitch (tokens en `src/styles.css`, tomados de `DESIGN.md`).

**Stack:** Angular 21 (standalone, signals, zoneless) · Tailwind CSS 4 · Material Symbols Rounded · Inter.

## Puesta en marcha

```bash
# 1. API (en el repo Audisoft)
docker compose up -d
dotnet run --project src/Audisoft.Api          # http://localhost:5023

# 2. Frontend
npm install
npm start                                       # http://localhost:4200
```

La URL de la API está en `src/environments/environment.ts`. La API ya permite CORS desde `http://localhost:4200`.

## Estructura

```
src/app/
├── core/
│   ├── models/        Tipos de la API (PagedResult, ProblemDetails, Student…)
│   ├── http/          Interceptor que convierte errores HTTP en ApiError (mensajes en español)
│   └── services/      StudentsService, TeachersService, SubjectsService, GradesService, ApiHealthService (GET /health), ThemeService
├── layout/            Shell: barra lateral, barra superior (migas, búsqueda Ctrl+K, modo oscuro)
├── shared/
│   ├── ui/            Toast, diálogo de confirmación, paginador, panel lateral, modal, avatar, filtro de fecha (día/rango)
│   ├── pipes/         shortDate ("06 nov 2026")
│   └── utils/         Formato de fechas/notas, exportación CSV
└── features/
    ├── home/          Panel general con el resumen de cada módulo y accesos directos
    ├── students/      Listado, formulario (crear/editar) y promedio ponderado
    ├── teachers/      Listado con filas expandibles, formulario y diálogo de eliminación bloqueada
    ├── subjects/      Catálogo con filtro por profesor, formulario y confirmación de eliminación
    └── grades/        Listado con filtros combinables, indicadores, distribución y registro/corrección
```

## Vista de Inicio

- Ruta por defecto (`/` redirige a `/home`). Saludo según la hora, hora de la última actualización y botón para recargar.
- **Una tarjeta por módulo** (Estudiantes, Profesores, Asignaturas, Notas) con tres cifras clave, una barra de
  progreso (tasa de actividad, docentes activos, docentes con carga, aprobación) y un botón de **acceso directo**.
- **Atención requerida**: asignaturas con docente inactivo, notas reprobadas, docentes activos sin asignaturas y
  estudiantes activos sin calificaciones, cada una con enlace al módulo correspondiente.
- Histograma de distribución de notas. Si falla un resumen, solo esa tarjeta muestra el error; si fallan todos,
  se muestra un aviso de conexión con opción de reintentar.

## Vista de Estudiantes

- Tabla con **paginación del servidor** (10/25/50 por página), búsqueda sin distinguir tildes, filtro por estado y
  **filtro de fecha de matrícula** con dos modos: **Día** (un solo campo; se envía `desde = hasta`) o **Rango**
  (el campo se expande para mostrar la fecha final). Al cambiar de modo se conserva lo elegido.
- **Ordenamiento** al pulsar los encabezados Código, Estudiante y Fecha de matrícula (otro clic invierte la dirección;
  la fecha empieza por la más reciente). En móvil se elige con un selector.
- Los filtros y el orden viven en la URL (`/students?search=perez&from=2025-01-01&sort=enrollmentDate&dir=desc`),
  así se pueden compartir y recargar. La exportación a CSV respeta filtros y orden.
- **Crear / editar** en panel lateral con validación en español; los errores de la API (correo o código duplicado)
  se muestran en el campo correspondiente.
- **Eliminar** con diálogo de confirmación.
- **Alertas** (toast) tras crear, actualizar, eliminar y exportar.
- **Promedio ponderado** por asignatura y general (escala 0.0–5.0, colores: rojo < 3.0, ámbar 3.0–3.9, verde ≥ 4.0).
- Indicadores (total, activos, inactivos, tasa de actividad), exportación a CSV de todos los resultados filtrados,
  modo oscuro y diseño adaptable (en móvil la tabla pasa a tarjetas).

## Vista de Profesores

- Misma base que Estudiantes: paginación del servidor, búsqueda por nombre o correo, filtro por estado, filtro de
  **fecha de registro** (día o rango, el mismo componente que en Estudiantes), todo en la URL, exportación a CSV y
  diseño adaptable.
- **Filas expandibles**: al abrir un profesor se cargan sus asignaturas a cargo (código, nombre y créditos).
- **Crear / editar** en panel lateral; al editar se puede marcar como inactivo (avisa si conserva asignaturas).
  Un correo duplicado se muestra en el campo.
- **Eliminar con reglas de la API**: si tiene asignaturas a cargo se informa en un diálogo que las lista y permite
  verlas; si tiene notas registradas (409) se ofrece marcarlo como inactivo en su lugar.
- Indicadores: cuerpo docente total, asignaturas cubiertas (promedio por docente activo) y profesores inactivos.

## Vista de Asignaturas

- Paginación del servidor, búsqueda por nombre o código y **filtro por profesor** en la URL
  (`/subjects?teacherId=1`); desde Profesores, "Ver en Asignaturas" abre el listado ya filtrado.
- Al pulsar el docente de una fila se filtran sus asignaturas.
- **Crear / editar** en panel lateral: código en mayúsculas, créditos 1–30 y selector con solo profesores activos.
  Código duplicado (409) y profesor inactivo (422) se muestran en el campo correspondiente.
- **Eliminar** con diálogo que advierte que también se eliminan las notas registradas en la asignatura.
- Indicadores: total de asignaturas, créditos totales (promedio por asignatura), docentes activos con carga
  y asignaturas cuyo docente está inactivo (requieren reasignación).

## Vista de Notas

- Filtros combinables por **estudiante** (buscador con autocompletado en el servidor), **profesor** y **asignatura**,
  en la URL (`/grades?studentId=4&subjectId=1`) y como etiquetas que se pueden quitar una a una.
  Al elegir un profesor, el selector de asignaturas muestra solo las suyas.
- Indicadores calculados por la API para los filtros aplicados: promedio, tasa de aprobación, riesgo académico
  (notas < 3.0) y cobertura (o la asignatura filtrada), más el histograma de distribución por rangos.
- **Registrar nota** en panel lateral: estudiante activo, asignatura (el profesor que califica es su titular),
  evaluación, nota y porcentaje. Muestra las evaluaciones ya registradas del estudiante en esa asignatura y el
  **porcentaje disponible** (la suma no puede pasar de 100%), y valida antes de enviar.
- **Corregir** evaluación, nota y porcentaje (estudiante, asignatura y profesor no cambian). **Eliminar** con confirmación.
- Los errores de reglas de negocio de la API (422/404) se muestran en el campo correspondiente.

## Peticiones por vista

Los indicadores salen de los endpoints `GET /api/{recurso}/summary`, que la API calcula en la base de datos,
y el estado del sistema de `GET /health` (cada 60 s, desde la barra lateral).

| Vista        | Peticiones al cargar |
|--------------|----------------------|
| Inicio       | los cuatro resúmenes (estudiantes, profesores, asignaturas y notas) en paralelo |
| Estudiantes  | listado + resumen |
| Profesores   | listado + resumen |
| Asignaturas  | listado + resumen + profesores (filtro y formulario; una vez al entrar) |
| Notas        | listado + resumen (con los mismos filtros) + profesores y asignaturas (una vez al entrar) |
