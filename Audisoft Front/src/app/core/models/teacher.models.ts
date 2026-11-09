import { PagedResult, SortDir } from './api.models';

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
  subjectCount: number;
}

export interface CreateTeacherDto {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateTeacherDto extends CreateTeacherDto {
  isActive: boolean;
}

export interface TeacherQuery {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  /** Fecha de registro yyyy-MM-dd, incluida. */
  registeredFrom?: string;
  /** Fecha de registro yyyy-MM-dd, incluida. */
  registeredTo?: string;
  /** true = con asignaturas a cargo; false = sin asignaturas. */
  hasSubjects?: boolean;
  sortBy?: TeacherSortBy;
  sortDir?: SortDir;
}

/** Columnas por las que la API puede ordenar el listado: apellido y nombre, o fecha de registro. */
export type TeacherSortBy = 'name' | 'createdAt';

export type TeachersPagedResult = PagedResult<Teacher>;

/** GET /profesores/resumen */
export interface TeachersSummary {
  total: number;
  active: number;
  inactive: number;
  /** Asignaturas registradas (todas tienen un docente a cargo). */
  subjects: number;
}
