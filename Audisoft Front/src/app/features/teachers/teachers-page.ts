import { Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { BehaviorSubject, Subject as RxSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

import { ApiError, SortDir } from '../../core/models/api.models';
import { Subject } from '../../core/models/subject.models';
import { Teacher, TeacherQuery, TeacherSortBy, TeachersPagedResult, TeachersSummary } from '../../core/models/teacher.models';
import { TeachersService } from '../../core/services/teachers.service';
import { ShortDatePipe } from '../../shared/pipes/short-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { DateFilter, DateRange } from '../../shared/ui/date-filter';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm.service';
import { Paginator } from '../../shared/ui/paginator';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { downloadCsv } from '../../shared/utils/csv';
import { formatShortDate } from '../../shared/utils/format';
import { StatusFilter, ListFilters, PAGE_SIZES, statusToIsActive, parseListFilters, toQueryParams as listToQueryParams } from '../../shared/utils/list-filters';
import { fetchAllPages } from '../../shared/utils/paging';
import { TeacherSubjectsPanel } from './teacher-subjects-panel';
import { TeacherDeleteBlocked } from './teacher-delete-blocked';
import { TeacherForm } from './teacher-form';

/** Filtros del listado; viven en la URL (?search=&status=&subjects=&from=&to=&sort=&dir=&page=&pageSize=). */
interface TeachersFilters extends ListFilters {
  /** Rango de fecha de registro (yyyy-MM-dd, ambos incluidos; un día puntual es desde = hasta). */
  from: string;
  to: string;
  /** Carga docente: con o sin asignaturas a cargo ('' = todos). */
  subjects: SubjectsFilter;
  sortBy: TeacherSortBy;
  sortDir: SortDir;
}

type SubjectsFilter = '' | 'with' | 'without';

const DEFAULT_SORT: { sortBy: TeacherSortBy; sortDir: SortDir } = { sortBy: 'name', sortDir: 'asc' };
/** Dirección con la que empieza cada columna al pulsarla por primera vez (fechas: más recientes primero). */
const FIRST_DIR: Record<TeacherSortBy, SortDir> = { name: 'asc', createdAt: 'desc' };

/** Opciones del selector de orden (en móvil no hay encabezados de tabla). */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name:asc', label: 'Apellido (A–Z)' },
  { value: 'name:desc', label: 'Apellido (Z–A)' },
  { value: 'createdAt:desc', label: 'Registro más reciente' },
  { value: 'createdAt:asc', label: 'Registro más antiguo' },
];

interface Blocked {
  teacher: Teacher;
  subjects: Subject[];
  message: string;
}

@Component({
  selector: 'app-teachers-page',
  imports: [Avatar, DateFilter, Paginator, ShortDatePipe, TeacherForm, TeacherSubjectsPanel, TeacherDeleteBlocked],
  templateUrl: './teachers-page.html',
})
export class TeachersPage {
  private readonly service = inject(TeachersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly skeletonRows = Array.from({ length: 5 });

  // ---------- Filtros (en la URL) ----------
  protected readonly filters = toSignal(this.route.queryParamMap.pipe(map(parseFilters)), {
    initialValue: parseFilters(this.route.snapshot.queryParamMap),
  });
  protected readonly searchText = signal(this.filters().search);
  private readonly searchInput$ = new RxSubject<string>();
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  // ---------- Estado de la vista ----------
  protected readonly result = signal<TeachersPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly stats = signal<TeachersSummary | null>(null);
  protected readonly exporting = signal(false);
  /** Profesor sobre el que hay una acción en curso (verificación o eliminación). */
  protected readonly busyId = signal<number | null>(null);
  protected readonly expanded = signal<ReadonlySet<number>>(new Set());

  protected readonly formTarget = signal<{ teacher: Teacher | null } | null>(null);
  protected readonly blocked = signal<Blocked | null>(null);

  protected readonly teachers = computed(() => this.result()?.items ?? []);
  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return !!f.search || !!f.status || !!f.subjects || !!f.from || !!f.to;
  });
  private readonly dateFilter = viewChild(DateFilter);
  protected readonly averagePerTeacher = computed(() => {
    const s = this.stats();
    return s && s.active > 0 ? (s.subjects / s.active).toFixed(1) : null;
  });

  constructor() {
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
        if (page.items.length === 0 && page.page > 1 && page.totalPages > 0) {
          this.updateFilters({ page: page.totalPages });
          return;
        }
        this.result.set(page);
      });

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.updateFilters({ search, page: 1 }));

    effect(() => this.searchText.set(this.filters().search));

    this.loadStats();
  }

  // ---------- Filtros y paginación ----------
  protected onSearch(value: string): void {
    this.searchText.set(value);
    this.searchInput$.next(value.trim());
  }

  protected onStatus(status: string): void {
    this.updateFilters({ status: status as StatusFilter, page: 1 });
  }

  protected onSubjects(subjects: string): void {
    this.updateFilters({ subjects: subjects as SubjectsFilter, page: 1 });
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.dateFilter()?.resetError();
    this.updateFilters({ search: '', status: '', subjects: '', from: '', to: '', page: 1 });
  }

  /** Fecha de registro: un día puntual (desde = hasta) o un rango. */
  protected onDate(range: DateRange): void {
    this.updateFilters({ ...range, page: 1 });
  }

  // ---------- Ordenamiento ----------
  /** Clic en un encabezado: invierte la dirección si ya es la columna activa. */
  protected sortBy(column: TeacherSortBy): void {
    const f = this.filters();
    const sortDir: SortDir = f.sortBy === column ? (f.sortDir === 'asc' ? 'desc' : 'asc') : FIRST_DIR[column];
    this.updateFilters({ sortBy: column, sortDir, page: 1 });
  }

  protected onSortOption(value: string): void {
    const [sortBy, sortDir] = value.split(':') as [TeacherSortBy, SortDir];
    this.updateFilters({ sortBy, sortDir, page: 1 });
  }

  /** aria-sort de cada encabezado. */
  protected ariaSort(column: TeacherSortBy): 'ascending' | 'descending' | 'none' {
    const f = this.filters();
    return f.sortBy !== column ? 'none' : f.sortDir === 'asc' ? 'ascending' : 'descending';
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

  private updateFilters(changes: Partial<TeachersFilters>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams({ ...this.filters(), ...changes }), replaceUrl: true });
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

  // ---------- Filas expandibles ----------
  protected isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  // ---------- Crear / editar ----------
  protected openCreate(): void {
    this.formTarget.set({ teacher: null });
  }

  protected openEdit(teacher: Teacher): void {
    this.formTarget.set({ teacher });
  }

  protected onSaved(event: { teacher: Teacher; created: boolean }): void {
    this.formTarget.set(null);
    const name = `${event.teacher.firstName} ${event.teacher.lastName}`;
    if (event.created) {
      this.toast.success('Profesor creado correctamente', `${name} ya forma parte del cuerpo docente.`);
    } else {
      this.toast.success('Cambios guardados correctamente', `Se actualizó la información de ${name}.`);
    }
    this.refresh();
  }

  // ---------- Eliminar ----------
  /**
   * Si el profesor tiene asignaturas, se informa sin pedir confirmación (la API lo rechazaría).
   * Si no, se confirma y se elimina; un 409 (p. ej. por notas registradas) también se informa.
   */
  protected remove(teacher: Teacher): void {
    if (teacher.subjectCount > 0) {
      this.showBlocked(teacher, '');
      return;
    }
    void this.confirmAndDelete(teacher);
  }

  private async confirmAndDelete(teacher: Teacher): Promise<void> {
    const name = `${teacher.firstName} ${teacher.lastName}`;
    const confirmed = await this.confirm.ask({
      title: `¿Eliminar a ${name}?`,
      message: 'El profesor dejará de aparecer en el sistema. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    this.busyId.set(teacher.id);
    this.service.delete(teacher.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Profesor eliminado', `${name} fue eliminado correctamente.`);
        this.refresh();
      },
      error: (err: ApiError) => {
        this.busyId.set(null);
        if (err.status === 409) {
          this.showBlocked(teacher, err.detail);
        } else {
          this.toast.error('No fue posible eliminar al profesor', err.detail);
          if (err.status === 404) this.refresh();
        }
      },
    });
  }

  /** Consulta las asignaturas a cargo para mostrarlas en el diálogo de bloqueo. */
  private showBlocked(teacher: Teacher, message: string): void {
    this.busyId.set(teacher.id);
    this.service.subjects(teacher.id).subscribe({
      next: (subjects) => {
        this.busyId.set(null);
        // El conteo estaba desactualizado y ya no tiene asignaturas: se sigue con la eliminación normal.
        if (subjects.length === 0 && !message) {
          void this.confirmAndDelete(teacher);
          return;
        }
        this.blocked.set({ teacher, subjects, message });
      },
      error: (err: ApiError) => {
        this.busyId.set(null);
        this.toast.error('No fue posible eliminar al profesor', message || err.detail);
      },
    });
  }

  protected viewSubjects(): void {
    const id = this.blocked()?.teacher.id;
    this.blocked.set(null);
    if (id === undefined) return;
    if (!this.isExpanded(id)) this.toggle(id);
    setTimeout(() => document.getElementById(`profesor-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  protected deactivate(): void {
    const target = this.blocked()?.teacher;
    this.blocked.set(null);
    if (!target) return;

    const { firstName, lastName, email } = target;
    this.service.update(target.id, { firstName, lastName, email, isActive: false }).subscribe({
      next: () => {
        this.toast.success('Profesor marcado como inactivo', `${name} ${lastName} ya no podrá recibir asignaturas ni registrar notas.`);
        this.refresh();
      },
      error: (err: ApiError) => this.toast.error('No fue posible actualizar al profesor', err.detail),
    });
  }

  // ---------- Exportar ----------
  protected async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const base = toQuery(this.filters());
      const rows = await fetchAllPages((page, pageSize) => this.service.list({ ...base, page, pageSize }));
      downloadCsv(
        `profesores-${new Date().toISOString().substring(0, 10)}.csv`,
        ['Nombre', 'Apellido', 'Correo electrónico', 'Asignaturas a cargo', 'Fecha de registro', 'Estado'],
        rows.map((p) => [p.firstName, p.lastName, p.email, p.subjectCount, formatShortDate(p.createdAt), p.isActive ? 'Activo' : 'Inactivo']),
      );
      this.toast.success('Exportación completada', `Se exportaron ${rows.length} profesores.`);
    } catch (err) {
      this.toast.error('No fue posible exportar', (err as ApiError).detail);
    } finally {
      this.exporting.set(false);
    }
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SORT_COLUMNS: TeacherSortBy[] = ['name', 'createdAt'];

function parseFilters(params: ParamMap): TeachersFilters {
  const date = (key: string) => {
    const v = params.get(key) ?? '';
    return ISO_DATE.test(v) && !Number.isNaN(Date.parse(v)) ? v : '';
  };
  let from = date('from');
  let to = date('to');
  if (from && to && from > to) [from, to] = [to, from]; // URL editada a mano
  const subjects = params.get('subjects');
  const sort = params.get('sort') as TeacherSortBy | null;
  const dir = params.get('dir');
  const validSort = !!sort && SORT_COLUMNS.includes(sort);
  return {
    ...parseListFilters(params),
    from,
    to,
    subjects: subjects === 'with' || subjects === 'without' ? subjects : '',
    sortBy: validSort ? sort : DEFAULT_SORT.sortBy,
    sortDir: dir === 'asc' || dir === 'desc' ? dir : validSort ? FIRST_DIR[sort] : DEFAULT_SORT.sortDir,
  };
}

/** Query params para la URL; omite los valores por defecto para que quede limpia. */
function toQueryParams(f: TeachersFilters): Params {
  const isDefaultSort = f.sortBy === DEFAULT_SORT.sortBy && f.sortDir === DEFAULT_SORT.sortDir;
  return {
    ...listToQueryParams(f),
    from: f.from || null,
    to: f.to || null,
    subjects: f.subjects || null,
    sort: isDefaultSort ? null : f.sortBy,
    dir: isDefaultSort ? null : f.sortDir,
  };
}

function toQuery(filters: TeachersFilters): TeacherQuery {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    isActive: statusToIsActive(filters.status),
    registeredFrom: filters.from || undefined,
    registeredTo: filters.to || undefined,
    hasSubjects: filters.subjects === '' ? undefined : filters.subjects === 'with',
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };
}
