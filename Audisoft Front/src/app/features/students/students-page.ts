import { Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { BehaviorSubject, Subject, catchError, combineLatest, debounceTime, distinctUntilChanged, interval, map, of, switchMap, tap } from 'rxjs';

import { ApiError } from '../../core/models/api.models';
import { Student, StudentQuery, StudentSortBy, StudentsPagedResult, StudentsSummary } from '../../core/models/student.models';
import { SortDir } from '../../core/models/api.models';
import { StudentsService } from '../../core/services/students.service';
import { ShortDatePipe } from '../../shared/pipes/short-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { DateFilter, DateRange } from '../../shared/ui/date-filter';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm.service';
import { Paginator } from '../../shared/ui/paginator';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { downloadCsv } from '../../shared/utils/csv';
import { formatShortDate, relativeTime } from '../../shared/utils/format';
import { StatusFilter, ListFilters, PAGE_SIZES, statusToIsActive, parseListFilters, toQueryParams as listToQueryParams } from '../../shared/utils/list-filters';
import { fetchAllPages } from '../../shared/utils/paging';
import { StudentForm } from './student-form';
import { StudentAverageDialog } from './student-average';

/** Filtros del listado; viven en la URL (?search=&status=&from=&to=&sort=&dir=&page=&pageSize=). */
interface StudentsFilters extends ListFilters {
  /** Rango de fecha de matrícula (yyyy-MM-dd, ambos incluidos). */
  from: string;
  to: string;
  sortBy: StudentSortBy;
  sortDir: SortDir;
}

const DEFAULT_SORT: { sortBy: StudentSortBy; sortDir: SortDir } = { sortBy: 'name', sortDir: 'asc' };
/** Dirección con la que empieza cada columna al pulsarla por primera vez (fechas: más recientes primero). */
const FIRST_DIR: Record<StudentSortBy, SortDir> = { name: 'asc', code: 'asc', enrollmentDate: 'desc' };

/** Opciones del selector de orden (en móvil no hay encabezados de tabla). */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name:asc', label: 'Nombre (A–Z)' },
  { value: 'name:desc', label: 'Nombre (Z–A)' },
  { value: 'code:asc', label: 'Código (ascendente)' },
  { value: 'code:desc', label: 'Código (descendente)' },
  { value: 'enrollmentDate:desc', label: 'Matrícula más reciente' },
  { value: 'enrollmentDate:asc', label: 'Matrícula más antigua' },
];

@Component({
  selector: 'app-students-page',
  imports: [Avatar, DateFilter, Paginator, ShortDatePipe, StudentForm, StudentAverageDialog],
  templateUrl: './students-page.html',
})
export class StudentsPage {
  private readonly service = inject(StudentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly year = new Date().getFullYear();
  protected readonly skeletonRows = Array.from({ length: 6 });

  // ---------- Filtros: la URL es la fuente de verdad (?search=&estado=&page=&pageSize=) ----------
  protected readonly filters = toSignal(this.route.queryParamMap.pipe(map(parseFilters)), {
    initialValue: parseFilters(this.route.snapshot.queryParamMap),
  });
  protected readonly sortOptions = SORT_OPTIONS;
  private readonly dateFilter = viewChild(DateFilter);
  protected readonly searchText = signal(this.filters().search);
  private readonly searchInput$ = new Subject<string>();
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  // ---------- Estado de la vista ----------
  protected readonly result = signal<StudentsPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly stats = signal<StudentsSummary | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  private readonly now = signal(new Date());
  protected readonly exporting = signal(false);
  protected readonly deletingId = signal<number | null>(null);

  protected readonly formTarget = signal<{ student: Student | null } | null>(null);
  protected readonly averageTarget = signal<Student | null>(null);

  protected readonly students = computed(() => this.result()?.items ?? []);
  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return !!f.search || !!f.status || !!f.from || !!f.to;
  });
  protected readonly updatedLabel = computed(() => {
    const updated = this.lastUpdated();
    return updated ? `Actualizado ${relativeTime(updated, this.now())}` : 'Cargando…';
  });
  protected readonly activityRate = computed(() => {
    const s = this.stats();
    return s && s.total > 0 ? Math.round((s.active / s.total) * 100) : null;
  });

  constructor() {
    // Carga de la tabla cada vez que cambian los filtros de la URL o se pide recargar.
    combineLatest([this.route.queryParamMap.pipe(map(parseFilters)), this.reload$])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([filters]) =>
          this.service.list(toQuery(filters)).pipe(
            catchError((err: ApiError) => {
              this.error.set(err);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.loading.set(false);
        if (!page) return;
        // Si la página quedó fuera de rango (p. ej. tras eliminar el último registro), retrocede.
        if (page.items.length === 0 && page.page > 1 && page.totalPages > 0) {
          this.updateFilters({ page: page.totalPages });
          return;
        }
        this.result.set(page);
        this.lastUpdated.set(new Date());
      });

    // Búsqueda con debounce: vuelve a la página 1.
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.updateFilters({ search, page: 1 }));

    // Si la búsqueda cambia desde fuera (buscador global), refleja el texto en el input.
    effect(() => this.searchText.set(this.filters().search));


    interval(30_000).pipe(takeUntilDestroyed()).subscribe(() => this.now.set(new Date()));

    this.loadStats();
  }

  // ---------- Filtros y paginación ----------
  protected onSearch(value: string): void {
    this.searchText.set(value);
    this.searchInput$.next(value.trim());
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.dateFilter()?.resetError();
    this.updateFilters({ search: '', status: '', from: '', to: '', page: 1 });
  }

  // ---------- Fecha de matrícula (día o rango) ----------
  protected onDate(range: DateRange): void {
    this.updateFilters({ ...range, page: 1 });
  }

  // ---------- Ordenamiento ----------
  /** Al pulsar una columna: si ya ordena, invierte la dirección; si no, empieza con su dirección natural. */
  protected sortBy(column: StudentSortBy): void {
    const f = this.filters();
    const sortDir: SortDir = f.sortBy === column ? (f.sortDir === 'asc' ? 'desc' : 'asc') : FIRST_DIR[column];
    this.updateFilters({ sortBy: column, sortDir, page: 1 });
  }

  protected onSortOption(value: string): void {
    const [sortBy, sortDir] = value.split(':') as [StudentSortBy, SortDir];
    this.updateFilters({ sortBy, sortDir, page: 1 });
  }

  /** aria-sort de cada encabezado. */
  protected ariaSort(column: StudentSortBy): 'ascending' | 'descending' | 'none' {
    const f = this.filters();
    return f.sortBy !== column ? 'none' : f.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  protected onStatus(status: string): void {
    this.updateFilters({ status: status as StatusFilter, page: 1 });
  }

  protected onPage(page: number): void {
    this.updateFilters({ page });
  }

  protected onPageSize(pageSize: number): void {
    this.updateFilters({ pageSize, page: 1 });
  }

  protected refresh(): void {
    this.reload$.next();
    this.loadStats();
  }

  private updateFilters(changes: Partial<StudentsFilters>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams({ ...this.filters(), ...changes }),
      replaceUrl: true,
    });
  }

  private loadStats(): void {
    this.service
      .summary()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((stats) => this.stats.set(stats));
  }

  // ---------- Acciones ----------
  protected openCreate(): void {
    this.formTarget.set({ student: null });
  }

  protected openEdit(student: Student): void {
    this.formTarget.set({ student });
  }

  protected onSaved(event: { student: Student; created: boolean }): void {
    this.formTarget.set(null);
    const name = `${event.student.firstName} ${event.student.lastName}`;
    if (event.created) {
      this.toast.success('Estudiante creado correctamente', `${name} quedó matriculado con el código ${event.student.studentCode}.`);
    } else {
      this.toast.success('Cambios guardados correctamente', `Se actualizó la información de ${name}.`);
    }
    this.refresh();
  }

  protected async remove(student: Student): Promise<void> {
    const name = `${student.firstName} ${student.lastName}`;
    const confirmed = await this.confirm.ask({
      title: `¿Eliminar a ${name}?`,
      message: 'También se eliminarán sus notas registradas. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    this.deletingId.set(student.id);
    this.service.delete(student.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.toast.success('Estudiante eliminado', `${name} fue eliminado correctamente.`);
        this.refresh();
      },
      error: (err: ApiError) => {
        this.deletingId.set(null);
        this.toast.error('No fue posible eliminar al estudiante', err.detail);
        if (err.status === 404) this.refresh();
      },
    });
  }

  /** Exporta a CSV todos los estudiantes que cumplen los filtros actuales (no solo la página visible). */
  protected async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const base = toQuery(this.filters());
      const rows = await fetchAllPages((page, pageSize) => this.service.list({ ...base, page, pageSize }));

      downloadCsv(
        `estudiantes-${new Date().toISOString().substring(0, 10)}.csv`,
        ['Código', 'Nombre', 'Apellido', 'Correo electrónico', 'Fecha de matrícula', 'Estado'],
        rows.map((e) => [e.studentCode, e.firstName, e.lastName, e.email, formatShortDate(e.enrollmentDate), e.isActive ? 'Activo' : 'Inactivo']),
      );
      this.toast.success('Exportación completada', `Se exportaron ${rows.length} estudiantes.`);
    } catch (err) {
      this.toast.error('No fue posible exportar', (err as ApiError).detail);
    } finally {
      this.exporting.set(false);
    }
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SORT_COLUMNS: StudentSortBy[] = ['name', 'code', 'enrollmentDate'];

function parseFilters(params: ParamMap): StudentsFilters {
  const sort = params.get('sort') as StudentSortBy | null;
  const dir = params.get('dir');
  const date = (key: string) => {
    const v = params.get(key) ?? '';
    return ISO_DATE.test(v) && !Number.isNaN(Date.parse(v)) ? v : '';
  };
  let from = date('from');
  let to = date('to');
  if (from && to && from > to) [from, to] = [to, from]; // URL editada a mano
  return {
    ...parseListFilters(params),
    from,
    to,
    sortBy: sort && SORT_COLUMNS.includes(sort) ? sort : DEFAULT_SORT.sortBy,
    sortDir: dir === 'asc' || dir === 'desc' ? dir : sort && SORT_COLUMNS.includes(sort) ? FIRST_DIR[sort] : DEFAULT_SORT.sortDir,
  };
}

/** Query params para la URL; omite los valores por defecto para que quede limpia. */
function toQueryParams(f: StudentsFilters): Params {
  const isDefaultSort = f.sortBy === DEFAULT_SORT.sortBy && f.sortDir === DEFAULT_SORT.sortDir;
  return {
    ...listToQueryParams(f),
    from: f.from || null,
    to: f.to || null,
    sort: isDefaultSort ? null : f.sortBy,
    dir: isDefaultSort ? null : f.sortDir,
  };
}

function toQuery(filters: StudentsFilters): StudentQuery {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    isActive: statusToIsActive(filters.status),
    enrolledFrom: filters.from || undefined,
    enrolledTo: filters.to || undefined,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };
}
