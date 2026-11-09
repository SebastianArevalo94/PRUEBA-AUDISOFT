using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Audisoft.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Renombra tablas, columnas, claves, índices y restricciones del esquema al inglés sin perder datos
    /// (sp_rename en lugar de DROP/CREATE).
    /// </summary>
    public partial class RenameSchemaToEnglish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Restricciones e índices filtrados que referencian columnas por nombre: se eliminan y se recrean al final.
            migrationBuilder.DropForeignKey(name: "FK_Asignaturas_Profesores_ProfesorId", table: "Asignaturas");
            migrationBuilder.DropForeignKey(name: "FK_Notas_Asignaturas_AsignaturaId", table: "Notas");
            migrationBuilder.DropForeignKey(name: "FK_Notas_Estudiantes_EstudianteId", table: "Notas");
            migrationBuilder.DropForeignKey(name: "FK_Notas_Profesores_ProfesorId", table: "Notas");
            migrationBuilder.DropCheckConstraint(name: "CK_Asignaturas_Creditos", table: "Asignaturas");
            migrationBuilder.DropCheckConstraint(name: "CK_Notas_Porcentaje", table: "Notas");
            migrationBuilder.DropCheckConstraint(name: "CK_Notas_Valor", table: "Notas");
            migrationBuilder.DropIndex(name: "UX_Asignaturas_Codigo", table: "Asignaturas");
            migrationBuilder.DropIndex(name: "UX_Estudiantes_CodigoEstudiantil", table: "Estudiantes");
            migrationBuilder.DropIndex(name: "UX_Estudiantes_Email", table: "Estudiantes");
            migrationBuilder.DropIndex(name: "UX_Profesores_Email", table: "Profesores");

            // 2. Tablas.
            migrationBuilder.RenameTable(name: "Estudiantes", newName: "Students");
            migrationBuilder.RenameTable(name: "Profesores", newName: "Teachers");
            migrationBuilder.RenameTable(name: "Asignaturas", newName: "Subjects");
            migrationBuilder.RenameTable(name: "Notas", newName: "Grades");

            // 3. Columnas (conservan los datos).
            migrationBuilder.RenameColumn(name: "Nombre", table: "Students", newName: "FirstName");
            migrationBuilder.RenameColumn(name: "Apellido", table: "Students", newName: "LastName");
            migrationBuilder.RenameColumn(name: "CodigoEstudiantil", table: "Students", newName: "StudentCode");
            migrationBuilder.RenameColumn(name: "FechaMatricula", table: "Students", newName: "EnrollmentDate");
            migrationBuilder.RenameColumn(name: "Activo", table: "Students", newName: "IsActive");
            migrationBuilder.RenameColumn(name: "FechaCreacion", table: "Students", newName: "CreatedAt");
            migrationBuilder.RenameColumn(name: "FechaModificacion", table: "Students", newName: "UpdatedAt");
            migrationBuilder.RenameColumn(name: "Eliminado", table: "Students", newName: "IsDeleted");
            migrationBuilder.RenameColumn(name: "FechaEliminacion", table: "Students", newName: "DeletedAt");
            migrationBuilder.RenameColumn(name: "Nombre", table: "Teachers", newName: "FirstName");
            migrationBuilder.RenameColumn(name: "Apellido", table: "Teachers", newName: "LastName");
            migrationBuilder.RenameColumn(name: "Activo", table: "Teachers", newName: "IsActive");
            migrationBuilder.RenameColumn(name: "FechaCreacion", table: "Teachers", newName: "CreatedAt");
            migrationBuilder.RenameColumn(name: "FechaModificacion", table: "Teachers", newName: "UpdatedAt");
            migrationBuilder.RenameColumn(name: "Eliminado", table: "Teachers", newName: "IsDeleted");
            migrationBuilder.RenameColumn(name: "FechaEliminacion", table: "Teachers", newName: "DeletedAt");
            migrationBuilder.RenameColumn(name: "Nombre", table: "Subjects", newName: "Name");
            migrationBuilder.RenameColumn(name: "Codigo", table: "Subjects", newName: "Code");
            migrationBuilder.RenameColumn(name: "Creditos", table: "Subjects", newName: "Credits");
            migrationBuilder.RenameColumn(name: "ProfesorId", table: "Subjects", newName: "TeacherId");
            migrationBuilder.RenameColumn(name: "FechaCreacion", table: "Subjects", newName: "CreatedAt");
            migrationBuilder.RenameColumn(name: "FechaModificacion", table: "Subjects", newName: "UpdatedAt");
            migrationBuilder.RenameColumn(name: "Eliminado", table: "Subjects", newName: "IsDeleted");
            migrationBuilder.RenameColumn(name: "FechaEliminacion", table: "Subjects", newName: "DeletedAt");
            migrationBuilder.RenameColumn(name: "Nombre", table: "Grades", newName: "Name");
            migrationBuilder.RenameColumn(name: "Valor", table: "Grades", newName: "Value");
            migrationBuilder.RenameColumn(name: "Porcentaje", table: "Grades", newName: "Percentage");
            migrationBuilder.RenameColumn(name: "FechaRegistro", table: "Grades", newName: "RecordedAt");
            migrationBuilder.RenameColumn(name: "EstudianteId", table: "Grades", newName: "StudentId");
            migrationBuilder.RenameColumn(name: "ProfesorId", table: "Grades", newName: "TeacherId");
            migrationBuilder.RenameColumn(name: "AsignaturaId", table: "Grades", newName: "SubjectId");
            migrationBuilder.RenameColumn(name: "FechaCreacion", table: "Grades", newName: "CreatedAt");
            migrationBuilder.RenameColumn(name: "FechaModificacion", table: "Grades", newName: "UpdatedAt");
            migrationBuilder.RenameColumn(name: "Eliminado", table: "Grades", newName: "IsDeleted");
            migrationBuilder.RenameColumn(name: "FechaEliminacion", table: "Grades", newName: "DeletedAt");

            // 4. Claves primarias e índices no filtrados.
            migrationBuilder.Sql("EXEC sp_rename N'[Students].[PK_Estudiantes]', N'PK_Students', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Teachers].[PK_Profesores]', N'PK_Teachers', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Subjects].[PK_Asignaturas]', N'PK_Subjects', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Grades].[PK_Notas]', N'PK_Grades', N'INDEX';");
            migrationBuilder.RenameIndex(name: "IX_Asignaturas_ProfesorId", table: "Subjects", newName: "IX_Subjects_TeacherId");
            migrationBuilder.RenameIndex(name: "IX_Notas_AsignaturaId", table: "Grades", newName: "IX_Grades_SubjectId");
            migrationBuilder.RenameIndex(name: "IX_Notas_EstudianteId_AsignaturaId", table: "Grades", newName: "IX_Grades_StudentId_SubjectId");
            migrationBuilder.RenameIndex(name: "IX_Notas_ProfesorId", table: "Grades", newName: "IX_Grades_TeacherId");

            // 5. Se recrean restricciones e índices únicos con los nombres nuevos.
            migrationBuilder.AddCheckConstraint(name: "CK_Subjects_Credits", table: "Subjects", sql: "[Credits] > 0");
            migrationBuilder.AddCheckConstraint(name: "CK_Grades_Percentage", table: "Grades", sql: "[Percentage] > 0 AND [Percentage] <= 100");
            migrationBuilder.AddCheckConstraint(name: "CK_Grades_Value", table: "Grades", sql: "[Value] >= 0.0 AND [Value] <= 5.0");
            migrationBuilder.CreateIndex(name: "UX_Subjects_Code", table: "Subjects", column: "Code", unique: true, filter: "[IsDeleted] = 0");
            migrationBuilder.CreateIndex(name: "UX_Students_StudentCode", table: "Students", column: "StudentCode", unique: true, filter: "[IsDeleted] = 0");
            migrationBuilder.CreateIndex(name: "UX_Students_Email", table: "Students", column: "Email", unique: true, filter: "[IsDeleted] = 0");
            migrationBuilder.CreateIndex(name: "UX_Teachers_Email", table: "Teachers", column: "Email", unique: true, filter: "[IsDeleted] = 0");
            migrationBuilder.AddForeignKey(name: "FK_Subjects_Teachers_TeacherId", table: "Subjects", column: "TeacherId", principalTable: "Teachers", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Grades_Subjects_SubjectId", table: "Grades", column: "SubjectId", principalTable: "Subjects", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Grades_Students_StudentId", table: "Grades", column: "StudentId", principalTable: "Students", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Grades_Teachers_TeacherId", table: "Grades", column: "TeacherId", principalTable: "Teachers", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1. Restricciones e índices filtrados que referencian columnas por nombre: se eliminan y se recrean al final.
            migrationBuilder.DropForeignKey(name: "FK_Subjects_Teachers_TeacherId", table: "Subjects");
            migrationBuilder.DropForeignKey(name: "FK_Grades_Subjects_SubjectId", table: "Grades");
            migrationBuilder.DropForeignKey(name: "FK_Grades_Students_StudentId", table: "Grades");
            migrationBuilder.DropForeignKey(name: "FK_Grades_Teachers_TeacherId", table: "Grades");
            migrationBuilder.DropCheckConstraint(name: "CK_Subjects_Credits", table: "Subjects");
            migrationBuilder.DropCheckConstraint(name: "CK_Grades_Percentage", table: "Grades");
            migrationBuilder.DropCheckConstraint(name: "CK_Grades_Value", table: "Grades");
            migrationBuilder.DropIndex(name: "UX_Subjects_Code", table: "Subjects");
            migrationBuilder.DropIndex(name: "UX_Students_StudentCode", table: "Students");
            migrationBuilder.DropIndex(name: "UX_Students_Email", table: "Students");
            migrationBuilder.DropIndex(name: "UX_Teachers_Email", table: "Teachers");

            // 2. Tablas.
            migrationBuilder.RenameTable(name: "Students", newName: "Estudiantes");
            migrationBuilder.RenameTable(name: "Teachers", newName: "Profesores");
            migrationBuilder.RenameTable(name: "Subjects", newName: "Asignaturas");
            migrationBuilder.RenameTable(name: "Grades", newName: "Notas");

            // 3. Columnas (conservan los datos).
            migrationBuilder.RenameColumn(name: "FirstName", table: "Estudiantes", newName: "Nombre");
            migrationBuilder.RenameColumn(name: "LastName", table: "Estudiantes", newName: "Apellido");
            migrationBuilder.RenameColumn(name: "StudentCode", table: "Estudiantes", newName: "CodigoEstudiantil");
            migrationBuilder.RenameColumn(name: "EnrollmentDate", table: "Estudiantes", newName: "FechaMatricula");
            migrationBuilder.RenameColumn(name: "IsActive", table: "Estudiantes", newName: "Activo");
            migrationBuilder.RenameColumn(name: "CreatedAt", table: "Estudiantes", newName: "FechaCreacion");
            migrationBuilder.RenameColumn(name: "UpdatedAt", table: "Estudiantes", newName: "FechaModificacion");
            migrationBuilder.RenameColumn(name: "IsDeleted", table: "Estudiantes", newName: "Eliminado");
            migrationBuilder.RenameColumn(name: "DeletedAt", table: "Estudiantes", newName: "FechaEliminacion");
            migrationBuilder.RenameColumn(name: "FirstName", table: "Profesores", newName: "Nombre");
            migrationBuilder.RenameColumn(name: "LastName", table: "Profesores", newName: "Apellido");
            migrationBuilder.RenameColumn(name: "IsActive", table: "Profesores", newName: "Activo");
            migrationBuilder.RenameColumn(name: "CreatedAt", table: "Profesores", newName: "FechaCreacion");
            migrationBuilder.RenameColumn(name: "UpdatedAt", table: "Profesores", newName: "FechaModificacion");
            migrationBuilder.RenameColumn(name: "IsDeleted", table: "Profesores", newName: "Eliminado");
            migrationBuilder.RenameColumn(name: "DeletedAt", table: "Profesores", newName: "FechaEliminacion");
            migrationBuilder.RenameColumn(name: "Name", table: "Asignaturas", newName: "Nombre");
            migrationBuilder.RenameColumn(name: "Code", table: "Asignaturas", newName: "Codigo");
            migrationBuilder.RenameColumn(name: "Credits", table: "Asignaturas", newName: "Creditos");
            migrationBuilder.RenameColumn(name: "TeacherId", table: "Asignaturas", newName: "ProfesorId");
            migrationBuilder.RenameColumn(name: "CreatedAt", table: "Asignaturas", newName: "FechaCreacion");
            migrationBuilder.RenameColumn(name: "UpdatedAt", table: "Asignaturas", newName: "FechaModificacion");
            migrationBuilder.RenameColumn(name: "IsDeleted", table: "Asignaturas", newName: "Eliminado");
            migrationBuilder.RenameColumn(name: "DeletedAt", table: "Asignaturas", newName: "FechaEliminacion");
            migrationBuilder.RenameColumn(name: "Name", table: "Notas", newName: "Nombre");
            migrationBuilder.RenameColumn(name: "Value", table: "Notas", newName: "Valor");
            migrationBuilder.RenameColumn(name: "Percentage", table: "Notas", newName: "Porcentaje");
            migrationBuilder.RenameColumn(name: "RecordedAt", table: "Notas", newName: "FechaRegistro");
            migrationBuilder.RenameColumn(name: "StudentId", table: "Notas", newName: "EstudianteId");
            migrationBuilder.RenameColumn(name: "TeacherId", table: "Notas", newName: "ProfesorId");
            migrationBuilder.RenameColumn(name: "SubjectId", table: "Notas", newName: "AsignaturaId");
            migrationBuilder.RenameColumn(name: "CreatedAt", table: "Notas", newName: "FechaCreacion");
            migrationBuilder.RenameColumn(name: "UpdatedAt", table: "Notas", newName: "FechaModificacion");
            migrationBuilder.RenameColumn(name: "IsDeleted", table: "Notas", newName: "Eliminado");
            migrationBuilder.RenameColumn(name: "DeletedAt", table: "Notas", newName: "FechaEliminacion");

            // 4. Claves primarias e índices no filtrados.
            migrationBuilder.Sql("EXEC sp_rename N'[Estudiantes].[PK_Students]', N'PK_Estudiantes', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Profesores].[PK_Teachers]', N'PK_Profesores', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Asignaturas].[PK_Subjects]', N'PK_Asignaturas', N'INDEX';");
            migrationBuilder.Sql("EXEC sp_rename N'[Notas].[PK_Grades]', N'PK_Notas', N'INDEX';");
            migrationBuilder.RenameIndex(name: "IX_Subjects_TeacherId", table: "Asignaturas", newName: "IX_Asignaturas_ProfesorId");
            migrationBuilder.RenameIndex(name: "IX_Grades_SubjectId", table: "Notas", newName: "IX_Notas_AsignaturaId");
            migrationBuilder.RenameIndex(name: "IX_Grades_StudentId_SubjectId", table: "Notas", newName: "IX_Notas_EstudianteId_AsignaturaId");
            migrationBuilder.RenameIndex(name: "IX_Grades_TeacherId", table: "Notas", newName: "IX_Notas_ProfesorId");

            // 5. Se recrean restricciones e índices únicos con los nombres nuevos.
            migrationBuilder.AddCheckConstraint(name: "CK_Asignaturas_Creditos", table: "Asignaturas", sql: "[Creditos] > 0");
            migrationBuilder.AddCheckConstraint(name: "CK_Notas_Porcentaje", table: "Notas", sql: "[Porcentaje] > 0 AND [Porcentaje] <= 100");
            migrationBuilder.AddCheckConstraint(name: "CK_Notas_Valor", table: "Notas", sql: "[Valor] >= 0.0 AND [Valor] <= 5.0");
            migrationBuilder.CreateIndex(name: "UX_Asignaturas_Codigo", table: "Asignaturas", column: "Codigo", unique: true, filter: "[Eliminado] = 0");
            migrationBuilder.CreateIndex(name: "UX_Estudiantes_CodigoEstudiantil", table: "Estudiantes", column: "CodigoEstudiantil", unique: true, filter: "[Eliminado] = 0");
            migrationBuilder.CreateIndex(name: "UX_Estudiantes_Email", table: "Estudiantes", column: "Email", unique: true, filter: "[Eliminado] = 0");
            migrationBuilder.CreateIndex(name: "UX_Profesores_Email", table: "Profesores", column: "Email", unique: true, filter: "[Eliminado] = 0");
            migrationBuilder.AddForeignKey(name: "FK_Asignaturas_Profesores_ProfesorId", table: "Asignaturas", column: "ProfesorId", principalTable: "Profesores", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Notas_Asignaturas_AsignaturaId", table: "Notas", column: "AsignaturaId", principalTable: "Asignaturas", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Notas_Estudiantes_EstudianteId", table: "Notas", column: "EstudianteId", principalTable: "Estudiantes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            migrationBuilder.AddForeignKey(name: "FK_Notas_Profesores_ProfesorId", table: "Notas", column: "ProfesorId", principalTable: "Profesores", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        }
    }
}
