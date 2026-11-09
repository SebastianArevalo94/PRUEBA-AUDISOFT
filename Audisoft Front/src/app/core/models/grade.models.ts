import { PagedResult } from './api.models';

export interface Grade {
  id: number;
  /** Nombre de la evaluación (p. ej. "Parcial 1"). */
  name: string;
  value: number;
  percentage: number;
  recordedAt: string;
  studentId: number;
  studentName: string;
  studentCode: string;
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
}

export interface CreateGradeDto {
  name: string;
  value: number;
  percentage: number;
  studentId: number;
  teacherId: number;
  subjectId: number;
}

/** Al corregir una nota no cambian estudiante, profesor ni asignatura. */
export interface UpdateGradeDto {
  name: string;
  value: number;
  percentage: number;
}

export interface GradeFilter {
  studentId?: number;
  teacherId?: number;
  subjectId?: number;
}

export interface GradeQuery extends GradeFilter {
  page: number;
  pageSize: number;
}

export interface GradeRange {
  label: string;
  from: number;
  to: number;
  count: number;
}

/** GET /notas/resumen (acepta los mismos filtros del listado). */
export interface GradesSummary {
  total: number;
  /** Media simple de los valores; null si no hay notas. */
  average: number | null;
  passed: number;
  failed: number;
  /** Porcentaje de notas ≥ 3.0; null si no hay notas. */
  passRate: number | null;
  subjectsGraded: number;
  studentsGraded: number;
  distribution: GradeRange[];
}

export type GradesPagedResult = PagedResult<Grade>;
