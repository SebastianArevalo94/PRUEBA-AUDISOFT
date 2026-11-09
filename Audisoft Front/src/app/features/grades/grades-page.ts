import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, from, map, of, switchMap, tap } from 'rxjs';

import { ApiError } from '../../core/models/api.models';
import { Subject } from '../../core/models/subject.models';
import { Grade, GradeFilter, GradesPagedResult, GradesSummary } from '../../core/models/grade.models';
import { Teacher } from '../../core/models/teacher.models';
import { SubjectsService } from '../../core/services/subjects.service';
import { StudentsService } from '../../core/services/students.service';
import { GradesService } from '../../core/services/grades.service';
import { TeachersService } from '../../core/services/teachers.service';
import { ShortDatePipe } from '../../shared/pipes/short-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm.service';
import { Paginator } from '../../shared/ui/paginator';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { downloadCsv } from '../../shared/utils/csv';
import { formatGrade, formatPercent, formatShortDate, gradeTone } from '../../shared/utils/format';
import { PAGE_SIZES } from '../../shared/utils/list-filters';
import { fetchAllPages } from '../../shared/utils/paging';
import { StudentOption, StudentPicker } from './student-picker';
import { GradeForm } from './grade-form';

/** Filtros del listado; viven en la URL (?estudianteId=&profesorId=&asignaturaId=&page=&pageSize=). */
interface GradesFilters {
  studentId: number | null;
  teacherId: number | null;
  subjectId: number | null;
  page: number;
  pageSize: number;
}

/** Colores de las barras del histograma, por tono de la escala. */
const BAR_TONE = { danger: 'bg-danger/70', warning: 'bg-warning/70', success: 'bg-success/70' } as const;

@Component({
  selector: 'app-grades-page',
  imports: [Avatar, Paginator, ShortDatePipe, StudentPicker, GradeForm],
  templateUrl: './grades-page.html',
})
export class GradesPage {
  private readonly service = inject(GradesService);
  private readonly studentsService = inject(StudentsService);
  private readonly teachersService = inject(TeachersService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly skeletonRows = Array.from({ length: 6 });
  protected readonly fmtGrade = formatGrade;
  protected readonly percent = formatPercent;
  protected readonly tone = gradeTone;

  // ---------- Filtros (en la URL) ----------
  protected readonly filters = toSignal(this.route.queryParamMap.pipe(map(parseFilters)), {
    initialValue: parseFilters(this.route.snapshot.queryParamMap),
  });
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  // ---------- Estado de la vista ----------
  protected readonly result = signal<GradesPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly summary = signal<GradesSummary | null>(null);
  protected readonly exporting = signal(false);
  protected readonly busyId = signal<number | null>(null);
  protected readonly teachers = signal<Teacher[] | null>(null);
  protected readonly subjects = signal<Subject[] | null>(null);
  /** Estudiante del filtro (nombre y código para el selector y la etiqueta). */
  protected readonly filteredStudent = signal<StudentOption | null>(null);

  protected readonly formTarget = signal<{ grade: Grade | null } | null>(null);

  protected readonly grades = computed(() => this.result()?.items ?? []);
  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return f.studentId !== null || f.teacherId !== null || f.subjectId !== null;
  });

  protected readonly sortedTeachers = computed(() =>
    [...(this.teachers() ?? [])].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es')),
  );
  /** Si hay profesor filtrado, solo sus asignaturas. */
  protected readonly filterSubjects = computed(() => {
    const teacherId = this.filters().teacherId;
    return [...(this.subjects() ?? [])]
      .filter((a) => teacherId === null || a.teacherId === teacherId)
      .sort((a, b) => a.code.localeCompare(b.code, 'es'));
  });
  protected readonly filteredTeacher = computed(() => (this.teachers() ?? []).find((p) => p.id === this.filters().teacherId) ?? null);
  protected readonly filteredSubject = computed(() => (this.subjects() ?? []).find((a) => a.id === this.filters().subjectId) ?? null);

  /** Histograma: altura relativa al rango con más notas y rango predominante. */
  protected readonly distribution = computed(() => {
    const r = this.summary();
    if (!r) return null;
    const max = Math.max(...r.distribution.map((d) => d.count), 0);
    const bars = r.distribution.map((d) => ({
      ...d,
      height: max ? Math.max(6, Math.round((d.count / max) * 100)) : 6,
      color: BAR_TONE[gradeTone(d.from)],
      percentage: r.total ? Math.round((d.count / r.total) * 100) : 0,
    }));
    const top = max ? bars.find((b) => b.count === max)! : null;
    return { bars, top };
  });

  protected readonly atRisk = computed(() => {
    const r = this.summary();
    return r && r.passRate !== null ? Number((100 - r.passRate).toFixed(1)) : null;
  });

  constructor() {
    const filters$ = this.route.queryParamMap.pipe(map(parseFilters));

    // Listado
    combineLatest([filters$, this.reload$])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([f]) =>
          this.service.list({ ...toFilters(f), page: f.page, pageSize: f.pageSize }).pipe(
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

    // Indicadores: solo dependen de los filtros, no de la página.
    combineLatest([filters$.pipe(map(toFilters), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))), this.reload$])
      .pipe(
        switchMap(([f]) => this.service.summary(f).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((r) => this.summary.set(r));

    // Nombre del estudiante filtrado cuando llega por URL (p. ej. al recargar o compartir el enlace).
    // Solo reacciona a la URL: al elegirlo en el selector ya se conoce y no se vuelve a pedir.
    effect(() => {
      const id = this.filters().studentId;
      const current = untracked(() => this.filteredStudent());
      if (id === null) {
        if (current) this.filteredStudent.set(null);
      } else if (current?.id !== id) {
        this.studentsService.get(id).subscribe({
          next: (e) => this.filteredStudent.set({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.studentCode, isActive: e.isActive }),
          error: () => this.filteredStudent.set({ id, name: `Estudiante #${id}`, code: '', isActive: false }),
        });
      }
    });

    this.loadCatalogs();
  }

  // ---------- Filtros y paginación ----------
  protected onStudent(e: StudentOption | null): void {
    this.filteredStudent.set(e);
    this.updateFilters({ studentId: e?.id ?? null, page: 1 });
  }

  protected onTeacher(value: string): void {
    const teacherId = value ? Number(value) : null;
    const subject = this.filteredSubject();
    // Si la asignatura elegida no es de ese profesor, se quita.
    const subjectId = subject && teacherId !== null && subject.teacherId !== teacherId ? null : this.filters().subjectId;
    this.updateFilters({ teacherId, subjectId, page: 1 });
  }

  protected onSubject(value: string): void {
    this.updateFilters({ subjectId: value ? Number(value) : null, page: 1 });
  }

  protected removeFilter(key: 'studentId' | 'teacherId' | 'subjectId'): void {
    if (key === 'studentId') this.filteredStudent.set(null);
    this.updateFilters({ [key]: null, page: 1 });
  }

  protected clearFilters(): void {
    this.filteredStudent.set(null);
    this.updateFilters({ studentId: null, teacherId: null, subjectId: null, page: 1 });
  }

  protected onPage(page: number): void {
    this.updateFilters({ page });
  }

  protected onPageSize(pageSize: number): void {
    this.updateFilters({ pageSize, page: 1 });
  }

  protected refresh(): void {
    this.reload$.next();
  }

  protected refreshAll(): void {
    this.refresh();
    this.loadCatalogs();
  }

  private updateFilters(changes: Partial<GradesFilters>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams({ ...this.filters(), ...changes }), replaceUrl: true });
  }

  /** Profesores y asignaturas para los filtros y el formulario (paginados de a 100). */
  private loadCatalogs(): void {
    from(
      Promise.all([
        fetchAllPages((page, pageSize) => this.teachersService.list({ page, pageSize })),
        fetchAllPages((page, pageSize) => this.subjectsService.list({ page, pageSize })),
      ]),
    )
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.teachers.set(data?.[0] ?? []);
        this.subjects.set(data?.[1] ?? []);
      });
  }

  /** Apellido para las iniciales del avatar (la API envía el nombre completo). */
  protected lastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  // ---------- Registrar / corregir ----------
  protected openCreate(): void {
    this.formTarget.set({ grade: null });
  }

  protected openEdit(grade: Grade): void {
    this.formTarget.set({ grade });
  }

  protected onSaved(event: { grade: Grade; created: boolean }): void {
    this.formTarget.set(null);
    const n = event.grade;
    if (event.created) {
      this.toast.success('Nota registrada correctamente', `${n.studentName} · ${n.name} (${n.subjectCode}): ${formatGrade(n.value)}.`);
    } else {
      this.toast.success('Nota corregida', `${n.studentName} · ${n.name}: ${formatGrade(n.value)} (${formatPercent(n.percentage)}).`);
    }
    this.refresh();
  }

  // ---------- Eliminar ----------
  protected async remove(grade: Grade): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: `¿Eliminar la nota "${grade.name}"?`,
      message: `Se eliminará la calificación ${formatGrade(grade.value)} (${formatPercent(grade.percentage)}) de ${grade.studentName} en ${grade.subjectName}. Su promedio se recalculará. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    this.busyId.set(grade.id);
    this.service.delete(grade.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Nota eliminada', `Se eliminó "${grade.name}" de ${grade.studentName}.`);
        this.refresh();
      },
      error: (err: ApiError) => {
        this.busyId.set(null);
        this.toast.error('No fue posible eliminar la nota', err.detail);
        if (err.status === 404) this.refresh();
      },
    });
  }

  // ---------- Exportar ----------
  protected async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const filters = toFilters(this.filters());
      const rows = await fetchAllPages((page, pageSize) => this.service.list({ ...filters, page, pageSize }));
      downloadCsv(
        `notas-${new Date().toISOString().substring(0, 10)}.csv`,
        ['Estudiante', 'Código estudiantil', 'Asignatura', 'Código asignatura', 'Evaluación', 'Porcentaje', 'Nota', 'Profesor', 'Fecha'],
        rows.map((n) => [
          n.studentName,
          n.studentCode,
          n.subjectName,
          n.subjectCode,
          n.name,
          formatPercent(n.percentage),
          formatGrade(n.value),
          n.teacherName,
          formatShortDate(n.recordedAt),
        ]),
      );
      this.toast.success('Exportación completada', `Se exportaron ${rows.length} ${rows.length === 1 ? 'nota' : 'notas'}.`);
    } catch (err) {
      this.toast.error('No fue posible exportar', (err as ApiError).detail);
    } finally {
      this.exporting.set(false);
    }
  }
}

function parseId(params: ParamMap, key: string): number | null {
  const n = Number(params.get(key));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseFilters(params: ParamMap): GradesFilters {
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));
  return {
    studentId: parseId(params, 'studentId'),
    teacherId: parseId(params, 'teacherId'),
    subjectId: parseId(params, 'subjectId'),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : PAGE_SIZES[0],
  };
}

function toQueryParams(f: GradesFilters): Params {
  return {
    studentId: f.studentId,
    teacherId: f.teacherId,
    subjectId: f.subjectId,
    page: f.page > 1 ? f.page : null,
    pageSize: f.pageSize !== PAGE_SIZES[0] ? f.pageSize : null,
  };
}

function toFilters(f: GradesFilters): GradeFilter {
  return {
    studentId: f.studentId ?? undefined,
    teacherId: f.teacherId ?? undefined,
    subjectId: f.subjectId ?? undefined,
  };
}
