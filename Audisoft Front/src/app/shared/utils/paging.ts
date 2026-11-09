import { Observable, firstValueFrom } from 'rxjs';

import { PagedResult } from '../../core/models/api.models';

/** Recorre todas las páginas de un listado (máximo de la API: 100 por página) y une los resultados. */
export async function fetchAllPages<T>(fetchPage: (page: number, pageSize: number) => Observable<PagedResult<T>>): Promise<T[]> {
  const pageSize = 100;
  const first = await firstValueFrom(fetchPage(1, pageSize));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => firstValueFrom(fetchPage(i + 2, pageSize))),
  );
  return [first, ...rest].flatMap((p) => p.items);
}
