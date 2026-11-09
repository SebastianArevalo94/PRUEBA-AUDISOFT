/** Dirección de ordenamiento de los listados. */
export type SortDir = 'asc' | 'desc';

/** Respuesta paginada de la API (PagedResult<T>). */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Cuerpo de error RFC 7807 que devuelve la API (ProblemDetails / ValidationProblemDetails). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

/** Error normalizado que reciben los componentes, sin importar cómo falló la petición. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly detail: string,
    /** Errores de validación por campo, con la clave en camelCase (p. ej. "email"). */
    readonly fieldErrors: Record<string, string[]> = {},
    readonly traceId?: string,
  ) {
    super(detail);
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}
