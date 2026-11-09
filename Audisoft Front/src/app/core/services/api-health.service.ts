import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, timer } from 'rxjs';

import { environment } from '../../../environments/environment';

export type ApiStatus = 'checking' | 'online' | 'offline';

/** Comprueba periódicamente que la API y su base de datos responden (GET /health, indicador "Estado del sistema"). */
@Injectable({ providedIn: 'root' })
export class ApiHealthService {
  private readonly http = inject(HttpClient);

  readonly status = signal<ApiStatus>('checking');
  readonly lastCheck = signal<Date | null>(null);

  constructor() {
    timer(0, 60_000)
      .pipe(
        switchMap(() =>
          this.http.get(environment.healthUrl, { responseType: 'text' }).pipe(
            map((): ApiStatus => 'online'),
            catchError(() => of<ApiStatus>('offline')),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((status) => {
        this.status.set(status);
        this.lastCheck.set(new Date());
      });
  }
}
