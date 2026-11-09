-- =====================================================================================
-- Datos de ejemplo para desarrollo y demostración.
-- Solo se insertan si la base está vacía (sin profesores, estudiantes ni asignaturas):
-- ejecutar el script varias veces nunca duplica ni modifica datos existentes.
--
-- Contenido: 11 profesores, 16 asignaturas, 40 estudiantes y notas aleatorias coherentes
-- con las reglas de la API:
--   * el profesor de cada nota es el titular de la asignatura (salvo un caso histórico, ver abajo);
--   * la suma de porcentajes de un estudiante en una asignatura nunca supera el 100%;
--   * valores entre 0.0 y 5.0 con un decimal.
-- Casos útiles para probar el frontend:
--   * Hernán Darío Quintero está inactivo y aún es titular de Ética Profesional ("con docente inactivo").
--   * Gloria Inés Arango no tiene asignaturas pero calificó los primeros cortes de Redes de Computadores
--     antes de que se reasignara: no se puede eliminar (tiene notas) y el frontend ofrece desactivarla.
--   * Sergio Alejandro Patiño no tiene asignaturas ni notas: se puede eliminar.
--   * 3 estudiantes inactivos.
-- =====================================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF EXISTS (SELECT 1 FROM dbo.Teachers) OR EXISTS (SELECT 1 FROM dbo.Students) OR EXISTS (SELECT 1 FROM dbo.Subjects)
BEGIN
    PRINT N'La base ya tiene datos: se omite la carga inicial.';
    RETURN;
END;

BEGIN TRANSACTION;

DECLARE @ahora datetime2 = SYSUTCDATETIME();
-- Inicio del semestre en curso: las evaluaciones se reparten cada dos semanas desde esta fecha.
DECLARE @inicioSemestre date = DATEADD(DAY, -95, CAST(@ahora AS date));

-- ---------------------------------------------------------------- Profesores
INSERT INTO dbo.Teachers (FirstName, LastName, Email, IsActive, CreatedAt, IsDeleted)
VALUES
    (N'Carlos Andrés',     N'Restrepo Gómez',   N'carlos.restrepo@universidad.edu.co',   1, DATEADD(DAY, -900, @ahora), 0),
    (N'María Fernanda',    N'Ospina Duque',     N'maria.ospina@universidad.edu.co',      1, DATEADD(DAY, -870, @ahora), 0),
    (N'Jorge Iván',        N'Castaño Ruiz',     N'jorge.castano@universidad.edu.co',     1, DATEADD(DAY, -820, @ahora), 0),
    (N'Ana María',         N'Rincón Vélez',     N'ana.rincon@universidad.edu.co',        1, DATEADD(DAY, -760, @ahora), 0),
    (N'Luis Eduardo',      N'Vargas Peña',      N'luis.vargas@universidad.edu.co',       1, DATEADD(DAY, -700, @ahora), 0),
    (N'Diana Patricia',    N'Salazar Mejía',    N'diana.salazar@universidad.edu.co',     1, DATEADD(DAY, -640, @ahora), 0),
    (N'Andrés Felipe',     N'Moreno Cárdenas',  N'andres.moreno@universidad.edu.co',     1, DATEADD(DAY, -500, @ahora), 0),
    (N'Claudia Marcela',   N'Henao Pérez',      N'claudia.henao@universidad.edu.co',     1, DATEADD(DAY, -430, @ahora), 0),
    (N'Hernán Darío',      N'Quintero Rojas',   N'hernan.quintero@universidad.edu.co',   0, DATEADD(DAY, -980, @ahora), 0),
    (N'Gloria Inés',       N'Arango Mesa',      N'gloria.arango@universidad.edu.co',     1, DATEADD(DAY, -600, @ahora), 0),
    (N'Sergio Alejandro',  N'Patiño Lozano',    N'sergio.patino@universidad.edu.co',     1, DATEADD(DAY, -20,  @ahora), 0);

-- ---------------------------------------------------------------- Asignaturas
INSERT INTO dbo.Subjects (Name, Code, Credits, TeacherId, CreatedAt, IsDeleted)
SELECT a.Name, a.Code, a.Credits, p.Id, DATEADD(DAY, -400, @ahora), 0
FROM (VALUES
    (N'Cálculo Diferencial',               N'MAT-101', 4, N'carlos.restrepo@universidad.edu.co'),
    (N'Cálculo Integral',                  N'MAT-102', 4, N'carlos.restrepo@universidad.edu.co'),
    (N'Álgebra Lineal',                    N'MAT-201', 3, N'maria.ospina@universidad.edu.co'),
    (N'Probabilidad y Estadística',        N'EST-201', 3, N'maria.ospina@universidad.edu.co'),
    (N'Física Mecánica',                   N'FIS-101', 4, N'jorge.castano@universidad.edu.co'),
    (N'Electricidad y Magnetismo',         N'FIS-102', 4, N'jorge.castano@universidad.edu.co'),
    (N'Fundamentos de Programación',       N'PRG-101', 3, N'ana.rincon@universidad.edu.co'),
    (N'Programación Orientada a Objetos',  N'PRG-201', 3, N'ana.rincon@universidad.edu.co'),
    (N'Estructuras de Datos',              N'PRG-202', 3, N'ana.rincon@universidad.edu.co'),
    (N'Bases de Datos I',                  N'BD-101',  3, N'luis.vargas@universidad.edu.co'),
    (N'Bases de Datos II',                 N'BD-201',  3, N'luis.vargas@universidad.edu.co'),
    (N'Ingeniería de Software',            N'ING-301', 3, N'diana.salazar@universidad.edu.co'),
    (N'Sistemas Operativos',               N'SIS-301', 3, N'diana.salazar@universidad.edu.co'),
    (N'Redes de Computadores',             N'RED-301', 3, N'andres.moreno@universidad.edu.co'),
    (N'Comunicación Oral y Escrita',       N'HUM-101', 2, N'claudia.henao@universidad.edu.co'),
    (N'Ética Profesional',                 N'HUM-201', 2, N'hernan.quintero@universidad.edu.co')
) AS a (Name, Code, Credits, TeacherEmail)
JOIN dbo.Teachers p ON p.Email = a.TeacherEmail;

-- ---------------------------------------------------------------- Estudiantes
INSERT INTO dbo.Students (FirstName, LastName, Email, StudentCode, EnrollmentDate, IsActive, CreatedAt, IsDeleted)
SELECT e.FirstName, e.LastName, e.Email,
       CONCAT(N'EST-', YEAR(e.Matricula), N'-', RIGHT(CONCAT(N'000', e.Num), 4)),
       e.Matricula, e.IsActive, CAST(e.Matricula AS datetime2), 0
FROM (VALUES
    ( 1, N'Santiago',        N'Ramírez Torres',     N'santiago.ramirez@estudiantes.edu.co',    CAST('2023-01-23' AS date), 1),
    ( 2, N'Valentina',       N'García López',       N'valentina.garcia@estudiantes.edu.co',    CAST('2023-01-23' AS date), 1),
    ( 3, N'Sebastián',       N'Martínez Ríos',      N'sebastian.martinez@estudiantes.edu.co',  CAST('2023-01-24' AS date), 1),
    ( 4, N'Isabella',        N'Rodríguez Mejía',    N'isabella.rodriguez@estudiantes.edu.co',  CAST('2023-01-25' AS date), 1),
    ( 5, N'Mateo',           N'Hernández Cruz',     N'mateo.hernandez@estudiantes.edu.co',     CAST('2023-07-24' AS date), 1),
    ( 6, N'Mariana',         N'Gómez Arango',       N'mariana.gomez@estudiantes.edu.co',       CAST('2023-07-24' AS date), 1),
    ( 7, N'Samuel',          N'López Zapata',       N'samuel.lopez@estudiantes.edu.co',        CAST('2023-07-25' AS date), 0),
    ( 8, N'Sofía',           N'Díaz Montoya',       N'sofia.diaz@estudiantes.edu.co',          CAST('2023-07-26' AS date), 1),
    ( 9, N'Juan José',       N'Pérez Cardona',      N'juanjose.perez@estudiantes.edu.co',      CAST('2024-01-22' AS date), 1),
    (10, N'Gabriela',        N'Sánchez Vélez',      N'gabriela.sanchez@estudiantes.edu.co',    CAST('2024-01-22' AS date), 1),
    (11, N'Daniel',          N'Torres Giraldo',     N'daniel.torres@estudiantes.edu.co',       CAST('2024-01-23' AS date), 1),
    (12, N'Luciana',         N'Castro Henao',       N'luciana.castro@estudiantes.edu.co',      CAST('2024-01-23' AS date), 1),
    (13, N'Nicolás',         N'Jiménez Ospina',     N'nicolas.jimenez@estudiantes.edu.co',     CAST('2024-01-24' AS date), 1),
    (14, N'Camila',          N'Moreno Salazar',     N'camila.moreno@estudiantes.edu.co',       CAST('2024-01-24' AS date), 1),
    (15, N'Alejandro',       N'Rojas Patiño',       N'alejandro.rojas@estudiantes.edu.co',     CAST('2024-07-22' AS date), 1),
    (16, N'Daniela',         N'Vargas Quintero',    N'daniela.vargas@estudiantes.edu.co',      CAST('2024-07-22' AS date), 1),
    (17, N'David',           N'Muñoz Restrepo',     N'david.munoz@estudiantes.edu.co',         CAST('2024-07-23' AS date), 1),
    (18, N'Sara',            N'Álvarez Duque',      N'sara.alvarez@estudiantes.edu.co',        CAST('2024-07-23' AS date), 1),
    (19, N'Tomás',           N'Romero Castaño',     N'tomas.romero@estudiantes.edu.co',        CAST('2024-07-24' AS date), 0),
    (20, N'Antonella',       N'Suárez Rincón',      N'antonella.suarez@estudiantes.edu.co',    CAST('2024-07-24' AS date), 1),
    (21, N'Felipe',          N'Ortiz Marín',        N'felipe.ortiz@estudiantes.edu.co',        CAST('2025-01-20' AS date), 1),
    (22, N'Manuela',         N'Herrera Bedoya',     N'manuela.herrera@estudiantes.edu.co',     CAST('2025-01-20' AS date), 1),
    (23, N'Emiliano',        N'Ruiz Franco',        N'emiliano.ruiz@estudiantes.edu.co',       CAST('2025-01-21' AS date), 1),
    (24, N'Juliana',         N'Medina Toro',        N'juliana.medina@estudiantes.edu.co',      CAST('2025-01-21' AS date), 1),
    (25, N'Martín',          N'Aguirre Londoño',    N'martin.aguirre@estudiantes.edu.co',      CAST('2025-01-22' AS date), 1),
    (26, N'Paula Andrea',    N'Correa Botero',      N'paula.correa@estudiantes.edu.co',        CAST('2025-01-22' AS date), 1),
    (27, N'Esteban',         N'Valencia Ríos',      N'esteban.valencia@estudiantes.edu.co',    CAST('2025-07-21' AS date), 1),
    (28, N'Laura Sofía',     N'Cárdenas Pineda',    N'laura.cardenas@estudiantes.edu.co',      CAST('2025-07-21' AS date), 1),
    (29, N'Miguel Ángel',    N'Osorio Gil',         N'miguel.osorio@estudiantes.edu.co',       CAST('2025-07-22' AS date), 1),
    (30, N'Natalia',         N'Arias Escobar',      N'natalia.arias@estudiantes.edu.co',       CAST('2025-07-22' AS date), 1),
    (31, N'Juan Pablo',      N'Mejía Cifuentes',    N'juanpablo.mejia@estudiantes.edu.co',     CAST('2025-07-23' AS date), 1),
    (32, N'Ana Lucía',       N'Buitrago Serna',     N'ana.buitrago@estudiantes.edu.co',        CAST('2025-07-23' AS date), 0),
    (33, N'Simón',           N'Velásquez Ochoa',    N'simon.velasquez@estudiantes.edu.co',     CAST('2026-01-26' AS date), 1),
    (34, N'María José',      N'Acosta Ramírez',     N'mariajose.acosta@estudiantes.edu.co',    CAST('2026-01-26' AS date), 1),
    (35, N'Jerónimo',        N'Guerrero Lozano',    N'jeronimo.guerrero@estudiantes.edu.co',   CAST('2026-01-27' AS date), 1),
    (36, N'Salomé',          N'Navarro Agudelo',    N'salome.navarro@estudiantes.edu.co',      CAST('2026-01-27' AS date), 1),
    (37, N'Andrés Camilo',   N'Pineda Uribe',       N'andres.pineda@estudiantes.edu.co',       CAST('2026-07-27' AS date), 1),
    (38, N'Valeria',         N'Quiroga Montes',     N'valeria.quiroga@estudiantes.edu.co',     CAST('2026-07-27' AS date), 1),
    (39, N'Kevin Steven',    N'Ocampo Ramos',       N'kevin.ocampo@estudiantes.edu.co',        CAST('2026-07-28' AS date), 1),
    (40, N'Mariana Isabel',  N'Benítez Soto',       N'mariana.benitez@estudiantes.edu.co',     CAST('2026-07-28' AS date), 1)
) AS e (Num, FirstName, LastName, Email, Matricula, IsActive);

-- ---------------------------------------------------------------- Notas
-- Plan de evaluación del semestre (suma 100%). Cada asignatura avanza un número distinto de cortes,
-- así el porcentaje evaluado varía entre asignaturas y siempre queda ≤ 100% por estudiante.
DECLARE @evaluaciones TABLE (Orden int PRIMARY KEY, Name nvarchar(100), Percentage decimal(5,2));
INSERT INTO @evaluaciones VALUES
    (1, N'Parcial 1',     25), (2, N'Taller 1', 10), (3, N'Quiz', 10),
    (4, N'Parcial 2',     25), (5, N'Proyecto', 15), (6, N'Examen final', 15);

-- Avance de cada asignatura: entre 2 y 6 evaluaciones ya realizadas.
DECLARE @avance TABLE (SubjectId int PRIMARY KEY, TeacherId int, Evaluadas int);
INSERT INTO @avance
SELECT Id, TeacherId, 2 + ABS(CHECKSUM(NEWID())) % 5 FROM dbo.Subjects;

-- Rendimiento base de cada estudiante (2.4 – 4.7): unos destacan y otros están en riesgo.
DECLARE @rendimiento TABLE (StudentId int PRIMARY KEY, Base decimal(4,2));
INSERT INTO @rendimiento
SELECT Id, 2.4 + (ABS(CHECKSUM(NEWID())) % 24) / 10.0 FROM dbo.Students;

-- Inscripciones: cada estudiante cursa entre 3 y 5 asignaturas elegidas al azar.
DECLARE @inscripciones TABLE (StudentId int, SubjectId int, PRIMARY KEY (StudentId, SubjectId));
INSERT INTO @inscripciones
SELECT e.Id, a.Id
FROM dbo.Students e
CROSS APPLY (
    SELECT TOP (3 + ABS(CHECKSUM(NEWID(), e.Id)) % 3) Id
    FROM dbo.Subjects
    ORDER BY NEWID()
) a;

-- Una nota por evaluación realizada: rendimiento del estudiante ± 1.2, acotado a 0.0 – 5.0.
INSERT INTO dbo.Grades (Name, Value, Percentage, RecordedAt, StudentId, TeacherId, SubjectId, CreatedAt, IsDeleted)
SELECT ev.Name,
       v.Value,
       ev.Percentage,
       f.Fecha,
       i.StudentId,
       av.TeacherId,
       i.SubjectId,
       f.Fecha,
       0
FROM @inscripciones i
JOIN @avance av ON av.SubjectId = i.SubjectId
JOIN @rendimiento r ON r.StudentId = i.StudentId
JOIN @evaluaciones ev ON ev.Orden <= av.Evaluadas
CROSS APPLY (
    -- Correlacionado con la fila para que NEWID() se evalúe por cada nota y no una sola vez.
    SELECT ((ABS(CHECKSUM(NEWID(), i.StudentId, i.SubjectId, ev.Orden)) % 25) - 12) / 10.0 AS Ruido
) n
CROSS APPLY (
    SELECT CAST(ROUND(
        CASE WHEN r.Base + n.Ruido > 5.0 THEN 5.0
             WHEN r.Base + n.Ruido < 0.0 THEN 0.0
             ELSE r.Base + n.Ruido END, 1) AS decimal(4,2)) AS Value
) v
CROSS APPLY (
    -- Cada evaluación cae dos semanas después de la anterior (± unos días), en horario de clase.
    SELECT DATEADD(MINUTE, 7 * 60 + ABS(CHECKSUM(NEWID(), i.StudentId, ev.Orden)) % (11 * 60),
           CAST(DATEADD(DAY, (ev.Orden - 1) * 14 + ABS(CHECKSUM(NEWID(), i.SubjectId)) % 5, @inicioSemestre) AS datetime2)) AS Fecha
) f
-- Los estudiantes inactivos dejaron el semestre a mitad de camino: solo tienen los primeros cortes.
JOIN dbo.Students e ON e.Id = i.StudentId
WHERE e.IsActive = 1 OR ev.Orden <= 2;

-- Caso histórico: Redes de Computadores la dictaba Gloria Inés Arango y se le reasignó a Andrés Felipe
-- Moreno a mitad de semestre. Las notas de los primeros cortes conservan a quien las calificó.
UPDATE n
SET TeacherId = (SELECT Id FROM dbo.Teachers WHERE Email = N'gloria.arango@universidad.edu.co')
FROM dbo.Grades n
JOIN dbo.Subjects a ON a.Id = n.SubjectId
WHERE a.Code = N'RED-301' AND n.Name IN (N'Parcial 1', N'Taller 1');

-- Si el azar dejó Redes sin notas en esos cortes, se garantiza al menos una para el caso de prueba.
IF NOT EXISTS (
    SELECT 1 FROM dbo.Grades n JOIN dbo.Teachers p ON p.Id = n.TeacherId
    WHERE p.Email = N'gloria.arango@universidad.edu.co')
BEGIN
    INSERT INTO dbo.Grades (Name, Value, Percentage, RecordedAt, StudentId, TeacherId, SubjectId, CreatedAt, IsDeleted)
    SELECT N'Parcial 1', 3.8, 25, DATEADD(DAY, 2, CAST(@inicioSemestre AS datetime2)), e.Id, p.Id, a.Id,
           DATEADD(DAY, 2, CAST(@inicioSemestre AS datetime2)), 0
    FROM dbo.Students e
    CROSS JOIN dbo.Teachers p
    CROSS JOIN dbo.Subjects a
    WHERE e.Email = N'santiago.ramirez@estudiantes.edu.co'
      AND p.Email = N'gloria.arango@universidad.edu.co'
      AND a.Code = N'RED-301'
      AND NOT EXISTS (SELECT 1 FROM dbo.Grades x WHERE x.StudentId = e.Id AND x.SubjectId = a.Id);
END;

COMMIT TRANSACTION;

DECLARE @resumen nvarchar(400) = CONCAT(
    N'Carga inicial completada: ',
    (SELECT COUNT(*) FROM dbo.Teachers),  N' profesores, ',
    (SELECT COUNT(*) FROM dbo.Subjects), N' asignaturas, ',
    (SELECT COUNT(*) FROM dbo.Students), N' estudiantes y ',
    (SELECT COUNT(*) FROM dbo.Grades),       N' notas.');
PRINT @resumen;
GO
