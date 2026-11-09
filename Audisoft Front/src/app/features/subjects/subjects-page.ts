import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Subject as RxSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, from, map, of, switchMap, tap } from 'rxjs';

import { ApiError, SortDir } from '../../core/models/api.models';
import { Subject, SubjectQuery, SubjectSortBy, SubjectsPagedResult, SubjectsSummary } from '../../core/models/subject.models';
import { Teacher } from '../../core/models/teacher.models';
import { SubjectsService } from '../../core/services/subjects.service';
import { TeachersService } from '../../core/services/teachers.service';
import { Avatar } from '../../shared/ui/avatar';
import { Paginator } from '../../shared/ui/paginator';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { downloadCsv } from '../../shared/utils/csv';
import { PAGE_SIZES, parseListFilters } from '../../shared/utils/list-filters';
import { fetchAllPages } from '../../shared/utils/paging';
import { SubjectDeleteDialog } from './subject-delete-dialog';
import { SubjectForm } from './subject-form';

/** Filtros del listado; viven en la URL (?search=&teacherId=&sort=&dir=&page=&pageSize=). */
interface SubjectFilters {
  search: string;
  teacherId: number | null;
  sortBy: SubjectSortBy;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

const DEFAULT_SORT: { sortBy: SubjectSortBy; sortDir: SortDir } = { sortBy: 'code', sortDir: 'asc' };
const SORT_COLUMNS: SubjectSortBy[] = ['code', 'name'];

/** Opciones del selector de orden (en móvil no hay encabezados de tabla). */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'code:asc', label: 'Código (ascendente)' },
  { value: 'code:desc', label: 'Código (descendente)' },
  { value: 'name:asc', label: 'Nombre (A–Z)' },
  { value: 'name:desc', label: 'Nombre (Z–A)' },
];

@Component({
  selector: 'app-subjects-page',
  imports: [Avatar, Paginator, RouterLink, SubjectForm, SubjectDeleteDialog],
  templateUrl: './subjects-page.html',
})
export class SubjectsPage {
  private readonly service = inject(SubjectsService);
  private readonly teachersService = inject(TeachersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
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
  protected readonly result = signal<SubjectsPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly stats = signal<SubjectsSummary | null>(null);
  protected readonly exporting = signal(false);
  /** Todos los profesores: filtro, formulario y estado del docente de cada fila. */
  protected readonly teachers = signal<Teacher[] | null>(null);

  protected readonly formTarget = signal<{ subject: Subject | null } | null>(null);
  protected readonly deleteTarget = signal<Subject | null>(null);
  protected readonly deleting = signal(false);

  protected readonly subjects = computed(() => this.result()?.items ?? []);
  protected readonly hasFilters = computed(() => !!this.filters().search || this.filters().teacherId !== null);

  protected readonly teachersById = computed(() => new Map((this.teachers() ?? []).map((p) => [p.id, p])));
  protected readonly sortedTeachers = computed(() =>
    [...(this.teachers() ?? [])].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es')),
  );
  /** Profesor del filtro activo (para el encabezado de resultados). */
  protected readonly filteredTeacher = computed(() => {
    const id = this.filters().teacherId;
    return id === null ? null : (this.teachersById().get(id) ?? null);
  });

  protected readonly averageCredits = computed(() => {
    const s = this.stats();
    return s && s.total > 0 ? (s.totalCredits / s.total).toFixed(1) : null;
  });
  protected readonly teacherCoverage = computed(() => {
    const s = this.stats();
    return s && s.activeTeachers > 0 ? Math.round((Math.min(s.teachersWithLoad, s.activeTeachers) / s.activeTeachers) * 100) : null;
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
    this.loadTeachers();
  }

  // ---------- Filtros y paginación ----------
  protected onSearch(value: string): void {
    this.searchText.set(value);
    this.searchInput$.next(value.trim());
  }

  protected onTeacher(value: string): void {
    this.updateFilters({ teacherId: value ? Number(value) : null, page: 1 });
  }

  protected filterByTeacher(teacherId: number): void {
    this.updateFilters({ teacherId, page: 1 });
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.updateFilters({ search: '', teacherId: null, page: 1 });
  }

  // ---------- Ordenamiento ----------
  /** Clic en un encabezado: invierte la dirección si ya es la columna activa (empieza siempre ascendente). */
  protected sortBy(column: SubjectSortBy): void {
    const f = this.filters();
    const sortDir: SortDir = f.sortBy === column && f.sortDir === 'asc' ? 'desc' : 'asc';
    this.updateFilters({ sortBy: column, sortDir, page: 1 });
  }

  protected onSortOption(value: string): void {
    const [sortBy, sortDir] = value.split(':') as [SubjectSortBy, SortDir];
    this.updateFilters({ sortBy, sortDir, page: 1 });
  }

  /** aria-sort de cada encabezado. */
  protected ariaSort(column: SubjectSortBy): 'ascending' | 'descending' | 'none' {
    const f = this.filters();
    return f.sortBy !== column ? 'none' : f.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  protected onPage(page: number): void {
    this.updateFilters({ page });
  }

  protected onPageSize(pageSize: number): void {
    this.updateFilters({ pageSize, page: 1 });
  }

  /** Recarga listado e indicadores (tras crear, editar o eliminar). */
  protected refresh(): void {
    this.reload$.next();
    this.loadStats();
  }

  /** Botón "Actualizar": además vuelve a pedir los profesores, por si cambiaron en otra pestaña. */
  protected refreshAll(): void {
    this.refresh();
    this.loadTeachers();
  }

  private updateFilters(changes: Partial<SubjectFilters>): void {
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

  /**
   * Todos los profesores (paginados de a 100): alimentan el filtro, el selector del formulario
   * y la marca de "docente inactivo" de cada fila. Se piden al entrar, no en cada recarga.
   */
  private loadTeachers(): void {
    from(fetchAllPages((page, pageSize) => this.teachersService.list({ page, pageSize })))
      .pipe(
        catchError(() => of([] as Teacher[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((teachers) => this.teachers.set(teachers));
  }

  /** Apellido del docente para las iniciales del avatar (la API solo envía el nombre completo). */
  protected teacherLastName(a: Subject): string {
    return this.teachersById().get(a.teacherId)?.lastName ?? a.teacherName?.split(' ').at(-1) ?? '';
  }

  protected isTeacherInactive(a: Subject): boolean {
    return this.teachersById().get(a.teacherId)?.isActive === false;
  }

  // ---------- Crear / editar ----------
  protected openCreate(): void {
    this.formTarget.set({ subject: null });
  }

  protected openEdit(subject: Subject): void {
    this.formTarget.set({ subject });
  }

  protected onSaved(event: { subject: Subject; created: boolean }): void {
    this.formTarget.set(null);
    const { name, code, teacherName } = event.subject;
    if (event.created) {
      this.toast.success('Asignatura creada correctamente', `${code} · ${name} quedó a cargo de ${teacherName ?? 'su docente'}.`);
    } else {
      this.toast.success('Cambios guardados correctamente', `Se actualizó ${code} · ${name}.`);
    }
    // Cambia la carga de los docentes (se muestra en el formulario): se recargan también.
    this.refreshAll();
  }

  // ---------- Eliminar ----------
  protected remove(subject: Subject): void {
    this.deleteTarget.set(subject);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    this.service.delete(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Asignatura eliminada', `${target.code} · ${target.name} y sus notas fueron eliminadas.`);
        this.refreshAll();
      },
      error: (err: ApiError) => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.error('No fue posible eliminar la asignatura', err.detail);
        if (err.status === 404) this.refresh();
      },
    });
  }

  // ---------- Exportar ----------
  protected async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const base = toQuery(this.filters());
      const rows = await fetchAllPages((page, pageSize) => this.service.list({ ...base, page, pageSize }));
      const byId = this.teachersById();
      downloadCsv(
        `asignaturas-${new Date().toISOString().substring(0, 10)}.csv`,
        ['Código', 'Asignatura', 'Créditos', 'Profesor titular', 'Estado del profesor'],
        rows.map((a) => {
          const p = byId.get(a.teacherId);
          return [a.code, a.name, a.credits, a.teacherName ?? 'Sin asignar', p ? (p.isActive ? 'Activo' : 'Inactivo') : ''];
        }),
      );
      this.toast.success('Exportación completada', `Se exportaron ${rows.length} asignaturas.`);
    } catch (err) {
      this.toast.error('No fue posible exportar', (err as ApiError).detail);
    } finally {
      this.exporting.set(false);
    }
  }
}

function parseFilters(params: ParamMap): SubjectFilters {
  const { search, page, pageSize } = parseListFilters(params);
  const teacherId = Number(params.get('teacherId'));
  const sort = params.get('sort') as SubjectSortBy | null;
  const dir = params.get('dir');
  return {
    search,
    page,
    pageSize,
    teacherId: Number.isInteger(teacherId) && teacherId > 0 ? teacherId : null,
    sortBy: sort && SORT_COLUMNS.includes(sort) ? sort : DEFAULT_SORT.sortBy,
    sortDir: dir === 'asc' || dir === 'desc' ? dir : DEFAULT_SORT.sortDir,
  };
}

function toQueryParams(filters: SubjectFilters): Params {
  const isDefaultSort = filters.sortBy === DEFAULT_SORT.sortBy && filters.sortDir === DEFAULT_SORT.sortDir;
  return {
    search: filters.search || null,
    teacherId: filters.teacherId ?? null,
    sort: isDefaultSort ? null : filters.sortBy,
    dir: isDefaultSort ? null : filters.sortDir,
    page: filters.page > 1 ? filters.page : null,
    pageSize: filters.pageSize !== PAGE_SIZES[0] ? filters.pageSize : null,
  };
}

function toQuery(filters: SubjectFilters): SubjectQuery {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    teacherId: filters.teacherId ?? undefined,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };
}
