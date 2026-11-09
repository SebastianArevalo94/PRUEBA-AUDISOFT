-- Crea la base de datos si no existe (la cadena de conexión de la API apunta a AudisoftAcademico).
IF DB_ID(N'AudisoftAcademico') IS NULL
    CREATE DATABASE [AudisoftAcademico];
GO
