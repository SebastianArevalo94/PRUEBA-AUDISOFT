import { PagedResult, SortDir } from './api.models';

export interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  teacherId: number;
  teacherName: string | null;
}

export interface CreateSubjectDto {
  name: string;
  code: string;
  credits: number;
  teacherId: number;
}

export type UpdateSubjectDto = CreateSubjectDto;

export interface SubjectQuery {
  page: number;
  pageSize: number;
  search?: string;
  teacherId?: number;
  sortBy?: SubjectSortBy;
  sortDir?: SortDir;
}

/** Columnas por las que la API puede ordenar el catálogo. */
export type SubjectSortBy = 'code' | 'name';

export type SubjectsPagedResult = PagedResult<Subject>;

/** GET /asignaturas/resumen */
export interface SubjectsSummary {
  total: number;
  totalCredits: number;
  /** Profesores activos con al menos una asignatura. */
  teachersWithLoad: number;
  activeTeachers: number;
  /** Asignaturas cuyo docente está inactivo: deben reasignarse. */
  withInactiveTeacher: number;
}
