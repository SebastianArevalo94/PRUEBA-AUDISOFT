import { PagedResult, SortDir } from './api.models';

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  enrollmentDate: string;
  isActive: boolean;
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  /** yyyy-MM-dd; si se omite, la API usa la fecha actual. */
  enrollmentDate?: string | null;
}

export interface UpdateStudentDto extends CreateStudentDto {
  isActive: boolean;
}

/** Columnas por las que la API puede ordenar el listado. */
export type StudentSortBy = 'name' | 'code' | 'enrollmentDate';

export interface StudentQuery {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  /** yyyy-MM-dd, incluida. */
  enrolledFrom?: string;
  /** yyyy-MM-dd, incluida. */
  enrolledTo?: string;
  sortBy?: StudentSortBy;
  sortDir?: SortDir;
}

export interface SubjectAverage {
  subjectId: number;
  code: string;
  name: string;
  credits: number;
  gradeCount: number;
  evaluatedPercentage: number;
  weightedAverage: number;
  accumulatedGrade: number;
}

export interface StudentAverage {
  studentId: number;
  fullName: string;
  studentCode: string;
  overallAverage: number | null;
  subjects: SubjectAverage[];
}

export type StudentsPagedResult = PagedResult<Student>;

/** GET /estudiantes/resumen */
export interface StudentsSummary {
  total: number;
  active: number;
  inactive: number;
}
