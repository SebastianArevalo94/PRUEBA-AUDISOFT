IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE TABLE [Estudiantes] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Apellido] nvarchar(100) NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [CodigoEstudiantil] nvarchar(20) NOT NULL,
        [FechaMatricula] datetime2 NOT NULL,
        [Activo] bit NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaModificacion] datetime2 NULL,
        [Eliminado] bit NOT NULL,
        [FechaEliminacion] datetime2 NULL,
        CONSTRAINT [PK_Estudiantes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE TABLE [Profesores] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Apellido] nvarchar(100) NOT NULL,
        [Email] nvarchar(150) NOT NULL,
        [Activo] bit NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaModificacion] datetime2 NULL,
        [Eliminado] bit NOT NULL,
        [FechaEliminacion] datetime2 NULL,
        CONSTRAINT [PK_Profesores] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE TABLE [Asignaturas] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(150) NOT NULL,
        [Codigo] nvarchar(20) NOT NULL,
        [Creditos] int NOT NULL,
        [ProfesorId] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaModificacion] datetime2 NULL,
        [Eliminado] bit NOT NULL,
        [FechaEliminacion] datetime2 NULL,
        CONSTRAINT [PK_Asignaturas] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Asignaturas_Creditos] CHECK ([Creditos] > 0),
        CONSTRAINT [FK_Asignaturas_Profesores_ProfesorId] FOREIGN KEY ([ProfesorId]) REFERENCES [Profesores] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE TABLE [Notas] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Valor] decimal(4,2) NOT NULL,
        [Porcentaje] decimal(5,2) NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        [EstudianteId] int NOT NULL,
        [ProfesorId] int NOT NULL,
        [AsignaturaId] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaModificacion] datetime2 NULL,
        [Eliminado] bit NOT NULL,
        [FechaEliminacion] datetime2 NULL,
        CONSTRAINT [PK_Notas] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Notas_Porcentaje] CHECK ([Porcentaje] > 0 AND [Porcentaje] <= 100),
        CONSTRAINT [CK_Notas_Valor] CHECK ([Valor] >= 0.0 AND [Valor] <= 5.0),
        CONSTRAINT [FK_Notas_Asignaturas_AsignaturaId] FOREIGN KEY ([AsignaturaId]) REFERENCES [Asignaturas] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Notas_Estudiantes_EstudianteId] FOREIGN KEY ([EstudianteId]) REFERENCES [Estudiantes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Notas_Profesores_ProfesorId] FOREIGN KEY ([ProfesorId]) REFERENCES [Profesores] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Asignaturas_ProfesorId] ON [Asignaturas] ([ProfesorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Asignaturas_Codigo] ON [Asignaturas] ([Codigo]) WHERE [Eliminado] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Estudiantes_CodigoEstudiantil] ON [Estudiantes] ([CodigoEstudiantil]) WHERE [Eliminado] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Estudiantes_Email] ON [Estudiantes] ([Email]) WHERE [Eliminado] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notas_AsignaturaId] ON [Notas] ([AsignaturaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notas_EstudianteId_AsignaturaId] ON [Notas] ([EstudianteId], [AsignaturaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notas_ProfesorId] ON [Notas] ([ProfesorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Profesores_Email] ON [Profesores] ([Email]) WHERE [Eliminado] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106224851_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261106224851_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Asignaturas] DROP CONSTRAINT [FK_Asignaturas_Profesores_ProfesorId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Notas] DROP CONSTRAINT [FK_Notas_Asignaturas_AsignaturaId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Notas] DROP CONSTRAINT [FK_Notas_Estudiantes_EstudianteId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Notas] DROP CONSTRAINT [FK_Notas_Profesores_ProfesorId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Asignaturas] DROP CONSTRAINT [CK_Asignaturas_Creditos];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Notas] DROP CONSTRAINT [CK_Notas_Porcentaje];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Notas] DROP CONSTRAINT [CK_Notas_Valor];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    DROP INDEX [UX_Asignaturas_Codigo] ON [Asignaturas];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    DROP INDEX [UX_Estudiantes_CodigoEstudiantil] ON [Estudiantes];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    DROP INDEX [UX_Estudiantes_Email] ON [Estudiantes];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    DROP INDEX [UX_Profesores_Email] ON [Profesores];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Estudiantes]', N'Students';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Profesores]', N'Teachers';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Asignaturas]', N'Subjects';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Notas]', N'Grades';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[Nombre]', N'FirstName', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[Apellido]', N'LastName', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[CodigoEstudiantil]', N'StudentCode', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[FechaMatricula]', N'EnrollmentDate', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[Activo]', N'IsActive', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[FechaCreacion]', N'CreatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[FechaModificacion]', N'UpdatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[Eliminado]', N'IsDeleted', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[FechaEliminacion]', N'DeletedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[Nombre]', N'FirstName', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[Apellido]', N'LastName', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[Activo]', N'IsActive', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[FechaCreacion]', N'CreatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[FechaModificacion]', N'UpdatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[Eliminado]', N'IsDeleted', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[FechaEliminacion]', N'DeletedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[Nombre]', N'Name', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[Codigo]', N'Code', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[Creditos]', N'Credits', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[ProfesorId]', N'TeacherId', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[FechaCreacion]', N'CreatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[FechaModificacion]', N'UpdatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[Eliminado]', N'IsDeleted', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[FechaEliminacion]', N'DeletedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[Nombre]', N'Name', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[Valor]', N'Value', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[Porcentaje]', N'Percentage', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[FechaRegistro]', N'RecordedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[EstudianteId]', N'StudentId', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[ProfesorId]', N'TeacherId', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[AsignaturaId]', N'SubjectId', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[FechaCreacion]', N'CreatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[FechaModificacion]', N'UpdatedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[Eliminado]', N'IsDeleted', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[FechaEliminacion]', N'DeletedAt', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Students].[PK_Estudiantes]', N'PK_Students', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Teachers].[PK_Profesores]', N'PK_Teachers', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[PK_Asignaturas]', N'PK_Subjects', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[PK_Notas]', N'PK_Grades', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Subjects].[IX_Asignaturas_ProfesorId]', N'IX_Subjects_TeacherId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[IX_Notas_AsignaturaId]', N'IX_Grades_SubjectId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[IX_Notas_EstudianteId_AsignaturaId]', N'IX_Grades_StudentId_SubjectId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC sp_rename N'[Grades].[IX_Notas_ProfesorId]', N'IX_Grades_TeacherId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'ALTER TABLE [Subjects] ADD CONSTRAINT [CK_Subjects_Credits] CHECK ([Credits] > 0)');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'ALTER TABLE [Grades] ADD CONSTRAINT [CK_Grades_Percentage] CHECK ([Percentage] > 0 AND [Percentage] <= 100)');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'ALTER TABLE [Grades] ADD CONSTRAINT [CK_Grades_Value] CHECK ([Value] >= 0.0 AND [Value] <= 5.0)');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Subjects_Code] ON [Subjects] ([Code]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Students_StudentCode] ON [Students] ([StudentCode]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Students_Email] ON [Students] ([Email]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Teachers_Email] ON [Teachers] ([Email]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Subjects] ADD CONSTRAINT [FK_Subjects_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teachers] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Grades] ADD CONSTRAINT [FK_Grades_Subjects_SubjectId] FOREIGN KEY ([SubjectId]) REFERENCES [Subjects] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Grades] ADD CONSTRAINT [FK_Grades_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Students] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    ALTER TABLE [Grades] ADD CONSTRAINT [FK_Grades_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teachers] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109011927_RenameSchemaToEnglish'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261109011927_RenameSchemaToEnglish', N'8.0.11');
END;
GO

COMMIT;
GO

