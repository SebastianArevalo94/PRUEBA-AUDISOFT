import { ParamMap, Params } from '@angular/router';

export const PAGE_SIZES = [10, 25, 50];

export type StatusFilter = '' | 'active' | 'inactive';

/** Filtros comunes de los listados; viven en la URL (?search=&status=&page=&pageSize=). */
export interface ListFilters {
  search: string;
  status: StatusFilter;
  page: number;
  pageSize: number;
}

export function parseListFilters(params: ParamMap): ListFilters {
  const status = params.get('status');
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));
  return {
    search: params.get('search') ?? '',
    status: status === 'active' || status === 'inactive' ? status : '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : PAGE_SIZES[0],
  };
}

/** Query params para la URL; omite los valores por defecto para que quede limpia. */
export function toQueryParams(filters: ListFilters): Params {
  return {
    search: filters.search || null,
    status: filters.status || null,
    page: filters.page > 1 ? filters.page : null,
    pageSize: filters.pageSize !== PAGE_SIZES[0] ? filters.pageSize : null,
  };
}

/** Traduce el filtro de estado al parámetro `isActive` de la API. */
export function statusToIsActive(status: StatusFilter): boolean | undefined {
  return status === '' ? undefined : status === 'active';
}
