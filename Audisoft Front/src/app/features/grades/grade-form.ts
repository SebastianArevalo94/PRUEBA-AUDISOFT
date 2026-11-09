import { Component, ElementRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Subject as RxSubject, catchError, map, of, switchMap } from 'rxjs';

import { ApiError } from '../../core/models/api.models';
import { Subject } from '../../core/models/subject.models';
import { Grade } from '../../core/models/grade.models';
import { Teacher } from '../../core/models/teacher.models';
import { GradesService } from '../../core/services/grades.service';
import { Drawer } from '../../shared/ui/drawer';
import { formatGrade, formatPercent, gradeTone } from '../../shared/utils/format';
import { applyApiErrors, controlErrorMessage } from '../../shared/utils/form-errors';
import { StudentOption, StudentPicker } from './student-picker';

type Field = 'studentId' | 'subjectId' | 'name' | 'value' | 'percentage';

/** Notas ya registradas del estudiante en la asignatura (para el porcentaje disponible). */
interface Assessments {
  grades: Grade[];
  recorded: number;
}

const MAX_PERCENTAGE = 100;

@Component({
  selector: 'app-grade-form',
  imports: [ReactiveFormsModule, Drawer, StudentPicker],
  templateUrl: './grade-form.html',
})
export class GradeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(GradesService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** null = registrar; con valor = corregir (solo evaluación, valor y porcentaje). */
  readonly grade = input<Grade | null>(null);
  /** Todas las asignaturas y profesores (null mientras cargan). */
  readonly subjects = input<Subject[] | null>(null);
  readonly teachers = input<Teacher[] | null>(null);
  /** Valores sugeridos al registrar (los filtros activos). */
  readonly suggestedStudent = input<StudentOption | null>(null);
  readonly suggestedSubject = input<number | null>(null);
  readonly saved = output<{ grade: Grade; created: boolean }>();
  readonly cancelled = output<void>();

  protected readonly isEdit = computed(() => this.grade() !== null);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly student = signal<StudentOption | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    studentId: [0, [Validators.min(1)]],
    subjectId: [0, [Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    value: [null as number | null, [Validators.required, Validators.min(0), Validators.max(5)]],
    percentage: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(MAX_PERCENTAGE), (c: AbstractControl) => this.validateAvailable(c)]],
  });

  private readonly subjectId = toSignal(this.form.controls.subjectId.valueChanges, { initialValue: 0 });
  private readonly value = toSignal(this.form.controls.value.valueChanges, { initialValue: null });
  private readonly percentage = toSignal(this.form.controls.percentage.valueChanges, { initialValue: null });

  private readonly teachersById = computed(() => new Map((this.teachers() ?? []).map((p) => [p.id, p])));
  protected readonly sortedSubjects = computed(() => [...(this.subjects() ?? [])].sort((a, b) => a.code.localeCompare(b.code, 'es')));
  protected readonly subject = computed(() => (this.subjects() ?? []).find((a) => a.id === this.subjectId()) ?? null);
  /** El profesor que califica es siempre el titular de la asignatura. */
  protected readonly teacher = computed(() => {
    const a = this.subject();
    return a ? (this.teachersById().get(a.teacherId) ?? null) : null;
  });
  protected readonly inactiveTeacher = computed(() => this.teacher()?.isActive === false);

  // ---------- Porcentaje disponible ----------
  private readonly assessmentsKey$ = new RxSubject<{ studentId: number; subjectId: number } | null>();
  protected readonly assessments = signal<Assessments | null>(null);
  protected readonly loadingAssessments = signal(false);
  protected readonly available = computed(() => {
    const ev = this.assessments();
    return ev ? Math.max(0, Number((MAX_PERCENTAGE - ev.recorded).toFixed(2))) : null;
  });

  protected readonly preview = computed(() => {
    const v = this.value();
    return v === null || v === undefined || `${v}` === '' || Number.isNaN(Number(v)) || v < 0 || v > 5 ? null : Number(v);
  });
  /** Aporte de la nota al acumulado de la asignatura: valor × porcentaje / 100. */
  protected readonly contribution = computed(() => {
    const v = this.preview();
    const p = Number(this.percentage());
    return v === null || !p || p <= 0 ? null : (v * p) / 100;
  });

  protected readonly Number = Number;
  protected readonly Math = Math;
  protected readonly fmtGrade = formatGrade;
  protected readonly percent = formatPercent;
  protected readonly tone = gradeTone;

  constructor() {
    this.assessmentsKey$
      .pipe(
        switchMap((key) => {
          if (!key) return of(null);
          this.loadingAssessments.set(true);
          return this.service.list({ ...key, page: 1, pageSize: 100 }).pipe(
            map((r) => {
              const currentId = this.grade()?.id;
              const grades = r.items.filter((n) => n.id !== currentId);
              return { grades, recorded: grades.reduce((sum, n) => sum + n.percentage, 0) };
            }),
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((ev) => {
        this.loadingAssessments.set(false);
        this.assessments.set(ev);
        this.form.controls.percentage.updateValueAndValidity();
      });

    this.form.controls.subjectId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.refreshAssessments());
  }

  ngOnInit(): void {
    const n = this.grade();
    if (n) {
      this.student.set({ id: n.studentId, name: n.studentName, code: n.studentCode, isActive: true });
      this.form.setValue({ studentId: n.studentId, subjectId: n.subjectId, name: n.name, value: n.value, percentage: n.percentage });
    } else {
      const e = this.suggestedStudent();
      if (e?.isActive) this.setStudent(e);
      if (this.suggestedSubject()) this.form.controls.subjectId.setValue(this.suggestedSubject()!);
    }
    this.refreshAssessments();
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>(n ? '#nombre' : 'input, select')?.focus());
  }

  protected setStudent(e: StudentOption | null): void {
    this.student.set(e);
    this.form.controls.studentId.setValue(e?.id ?? 0);
    this.form.controls.studentId.markAsTouched();
    this.refreshAssessments();
  }

  protected useAvailable(): void {
    const d = this.available();
    if (d) {
      this.form.controls.percentage.setValue(d);
      this.form.controls.percentage.markAsTouched();
    }
  }

  private refreshAssessments(): void {
    const studentId = this.form.controls.studentId.value;
    const subjectId = this.form.controls.subjectId.value;
    this.assessments.set(null);
    this.assessmentsKey$.next(studentId > 0 && subjectId > 0 ? { studentId, subjectId } : null);
  }

  private validateAvailable(control: AbstractControl): ValidationErrors | null {
    const d = this.available?.();
    const value = Number(control.value);
    return d !== null && d !== undefined && value > d + 1e-9 ? { available: d } : null;
  }

  protected errorOf(field: Field): string {
    const control = this.form.controls[field];
    const show = control.touched || this.submitted();
    if (!show || !control.errors) return '';
    const e = control.errors;
    if (e['server']) return e['server'];
    if (field === 'studentId' && e['min']) return 'Selecciona el estudiante.';
    if (field === 'subjectId' && e['min']) return 'Selecciona la asignatura.';
    if (field === 'value' && (e['min'] || e['max'])) return 'La nota debe estar entre 0.0 y 5.0.';
    if (field === 'percentage' && e['available'] !== undefined)
      return e['available'] === 0 ? 'El estudiante ya tiene el 100% evaluado en esta asignatura.' : `Solo queda ${formatPercent(e['available'])} disponible.`;
    if (field === 'percentage' && (e['min'] || e['max'])) return 'El porcentaje debe ser mayor que 0 y hasta 100.';
    return controlErrorMessage(control, show);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);
    if (!this.isEdit() && this.inactiveTeacher()) {
      this.form.controls.subjectId.setErrors({ server: 'El docente de esta asignatura está inactivo y no puede registrar notas.' });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.host.nativeElement.querySelector<HTMLElement>('.input-invalid, .input-invalid input')?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = { name: raw.name.trim(), value: Number(raw.value), percentage: Number(raw.percentage) };
    const current = this.grade();
    const request$ = current
      ? this.service.update(current.id, data)
      : this.service.create({ ...data, studentId: raw.studentId, subjectId: raw.subjectId, teacherId: this.subject()!.teacherId });

    this.saving.set(true);
    request$.subscribe({
      next: (grade) => {
        this.saving.set(false);
        this.saved.emit({ grade, created: !current });
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        if (applyApiErrors(this.form, err) || this.applyBusinessError(err)) return;
        this.formError.set(err.detail);
      },
    });
  }

  /** Lleva los 422/404 de la API al campo que corresponde. */
  private applyBusinessError(err: ApiError): boolean {
    if (err.status !== 422 && err.status !== 404) return false;
    const detail = err.detail.toLowerCase();
    const target: Field | null = detail.includes('porcentaje')
      ? 'percentage'
      : detail.includes('valor')
        ? 'value'
        : detail.includes('estudiante')
          ? 'studentId'
          : detail.includes('profesor') || detail.includes('asignatura')
            ? 'subjectId'
            : null;
    if (!target) return false;
    this.form.controls[target].setErrors({ server: err.detail });
    if (target === 'percentage') this.refreshAssessments();
    return true;
  }
}
