import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, catchError, forkJoin, interval, of, startWith, switchMap, tap } from 'rxjs';

import { SubjectsSummary } from '../../core/models/subject.models';
import { StudentsSummary } from '../../core/models/student.models';
import { GradesSummary } from '../../core/models/grade.models';
import { TeachersSummary } from '../../core/models/teacher.models';
import { ApiHealthService } from '../../core/services/api-health.service';
import { SubjectsService } from '../../core/services/subjects.service';
import { StudentsService } from '../../core/services/students.service';
import { GradesService } from '../../core/services/grades.service';
import { TeachersService } from '../../core/services/teachers.service';
import { gradeTone, relativeTime } from '../../shared/utils/format';

const BAR_TONE = { danger: 'bg-danger/70', warning: 'bg-warning/70', success: 'bg-success/70' } as const;

/** Resultado de cada resumen: `undefined` mientras carga, `null` si la petición falló. */
type Loaded<T> = T | null | undefined;

interface Summaries {
  students: StudentsSummary | null;
  teachers: TeachersSummary | null;
  subjects: SubjectsSummary | null;
  grades: GradesSummary | null;
}

interface Alert {
  icon: string;
  tone: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
  link: string;
  action: string;
}

/** Vista general: resumen de cada módulo con acceso directo. Una petición `/resumen` por módulo. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly studentsService = inject(StudentsService);
  private readonly teachersService = inject(TeachersService);
  private readonly subjectsService = inject(SubjectsService);
  private readonly gradesService = inject(GradesService);
  protected readonly health = inject(ApiHealthService);

  private readonly reload$ = new Subject<void>();

  protected readonly year = new Date().getFullYear();
  protected readonly loading = signal(true);
  protected readonly data = signal<Summaries | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  private readonly now = signal(new Date());

  protected readonly students = computed<Loaded<StudentsSummary>>(() => this.data()?.students ?? (this.data() ? null : undefined));
  protected readonly teachers = computed<Loaded<TeachersSummary>>(() => this.data()?.teachers ?? (this.data() ? null : undefined));
  protected readonly subjects = computed<Loaded<SubjectsSummary>>(() => this.data()?.subjects ?? (this.data() ? null : undefined));
  protected readonly grades = computed<Loaded<GradesSummary>>(() => this.data()?.grades ?? (this.data() ? null : undefined));

  /** Todas las peticiones fallaron: probablemente la API no está disponible. */
  protected readonly allFailed = computed(() => {
    const d = this.data();
    return !!d && !d.students && !d.teachers && !d.subjects && !d.grades;
  });

  protected readonly updatedLabel = computed(() => {
    const updated = this.lastUpdated();
    return updated ? `Actualizado ${relativeTime(updated, this.now())}` : 'Cargando…';
  });

  protected readonly greeting = computed(() => {
    const h = this.now().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  protected readonly activityRate = computed(() => pct(this.students()?.active, this.students()?.total));
  protected readonly activeTeacherRate = computed(() => pct(this.teachers()?.active, this.teachers()?.total));
  protected readonly teacherCoverage = computed(() => pct(this.subjects()?.teachersWithLoad, this.subjects()?.activeTeachers));

  protected readonly averageCredits = computed(() => {
    const a = this.subjects();
    return a && a.total ? Number((a.totalCredits / a.total).toFixed(1)) : null;
  });

  protected readonly subjectsPerTeacher = computed(() => {
    const p = this.teachers();
    return p && p.active ? Number((p.subjects / p.active).toFixed(1)) : null;
  });

  /** Histograma de notas: altura relativa al rango con más notas. */
  protected readonly distribution = computed(() => {
    const r = this.grades();
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

  /** Situaciones que requieren atención, derivadas de los resúmenes. */
  protected readonly alerts = computed<Alert[]>(() => {
    const d = this.data();
    if (!d) return [];
    const list: Alert[] = [];
    if (d.subjects?.withInactiveTeacher) {
      const n = d.subjects.withInactiveTeacher;
      list.push({
        icon: 'person_alert', tone: 'danger',
        title: `${n} ${n === 1 ? 'asignatura' : 'asignaturas'} con docente inactivo`,
        detail: 'Deben reasignarse a un profesor activo.',
        link: '/subjects', action: 'Reasignar',
      });
    }
    if (d.grades?.failed) {
      const n = d.grades.failed;
      list.push({
        icon: 'trending_down', tone: 'warning',
        title: `${n} ${n === 1 ? 'nota reprobada' : 'notas reprobadas'}`,
        detail: `Calificaciones por debajo de 3.0${d.grades.passRate !== null ? ` (${Number((100 - d.grades.passRate).toFixed(1))}% del total)` : ''}.`,
        link: '/grades', action: 'Revisar',
      });
    }
    if (d.subjects && d.subjects.activeTeachers > d.subjects.teachersWithLoad) {
      const n = d.subjects.activeTeachers - d.subjects.teachersWithLoad;
      list.push({
        icon: 'work_off', tone: 'info',
        title: `${n} ${n === 1 ? 'docente activo sin asignaturas' : 'docentes activos sin asignaturas'}`,
        detail: 'Pueden asumir nuevas asignaturas.',
        link: '/teachers', action: 'Ver profesores',
      });
    }
    if (d.students && d.students.total > 0 && d.grades && d.grades.studentsGraded < d.students.active) {
      const n = d.students.active - d.grades.studentsGraded;
      list.push({
        icon: 'pending_actions', tone: 'info',
        title: `${n} ${n === 1 ? 'estudiante activo' : 'estudiantes activos'} sin calificaciones`,
        detail: 'Aún no tienen notas registradas en ninguna asignatura.',
        link: '/grades', action: 'Registrar notas',
      });
    }
    return list;
  });

  constructor() {
    this.reload$
      .pipe(
        startWith(undefined),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          forkJoin({
            students: this.studentsService.summary().pipe(catchError(() => of(null))),
            teachers: this.teachersService.summary().pipe(catchError(() => of(null))),
            subjects: this.subjectsService.summary().pipe(catchError(() => of(null))),
            grades: this.gradesService.summary({}).pipe(catchError(() => of(null))),
          }),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((d) => {
        this.data.set(d);
        this.loading.set(false);
        this.lastUpdated.set(new Date());
        this.now.set(new Date());
      });

    interval(30_000).pipe(takeUntilDestroyed()).subscribe(() => this.now.set(new Date()));
  }

  protected refresh(): void {
    this.reload$.next();
  }
}

function pct(part: number | undefined, total: number | undefined): number | null {
  return part !== undefined && total ? Math.round((part / total) * 100) : null;
}
