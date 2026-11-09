import { Component, ElementRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/models/api.models';
import { Subject } from '../../core/models/subject.models';
import { Teacher } from '../../core/models/teacher.models';
import { SubjectsService } from '../../core/services/subjects.service';
import { Drawer } from '../../shared/ui/drawer';
import { applyApiErrors, controlErrorMessage } from '../../shared/utils/form-errors';

type Field = 'name' | 'code' | 'credits' | 'teacherId';

@Component({
  selector: 'app-subject-form',
  imports: [ReactiveFormsModule, Drawer],
  templateUrl: './subject-form.html',
})
export class SubjectForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SubjectsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** null = crear; con valor = editar. */
  readonly subject = input<Subject | null>(null);
  /** Todos los profesores (null mientras cargan). Solo los activos pueden recibir asignaturas. */
  readonly teachers = input<Teacher[] | null>(null);
  /** Profesor sugerido al crear (p. ej. el del filtro activo). */
  readonly suggestedTeacher = input<number | null>(null);
  readonly saved = output<{ subject: Subject; created: boolean }>();
  readonly cancelled = output<void>();

  protected readonly isEdit = computed(() => this.subject() !== null);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: ['', [Validators.required, Validators.maxLength(20)]],
    credits: [3, [Validators.required, Validators.min(1), Validators.max(30)]],
    teacherId: [0, [Validators.required, Validators.min(1)]],
  });

  private readonly teacherIdValue = toSignal(this.form.controls.teacherId.valueChanges, { initialValue: 0 });

  protected readonly active = computed(() =>
    (this.teachers() ?? [])
      .filter((p) => p.isActive)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es')),
  );

  /** Profesor actual de la asignatura cuando está inactivo: se muestra para que se entienda por qué hay que cambiarlo. */
  protected readonly inactiveTeacher = computed(() => {
    const current = this.subject();
    if (!current) return null;
    const p = (this.teachers() ?? []).find((x) => x.id === current.teacherId);
    return p && !p.isActive ? p : null;
  });

  protected readonly selectedTeacher = computed(() => (this.teachers() ?? []).find((p) => p.id === this.teacherIdValue()) ?? null);

  ngOnInit(): void {
    const a = this.subject();
    if (a) {
      this.form.setValue({ name: a.name, code: a.code, credits: a.credits, teacherId: a.teacherId });
    } else if (this.suggestedTeacher()) {
      this.form.controls.teacherId.setValue(this.suggestedTeacher()!);
    }
    queueMicrotask(() => this.host.nativeElement.querySelector('input')?.focus());
  }

  protected toUpper(control: AbstractControl): void {
    const value = String(control.value ?? '');
    if (value !== value.toUpperCase()) control.setValue(value.toUpperCase(), { emitEvent: false });
  }

  protected errorOf(field: Field): string {
    const control = this.form.controls[field];
    const show = control.touched || this.submitted();
    if (field === 'teacherId' && show && control.errors?.['min']) return 'Selecciona el profesor responsable.';
    return controlErrorMessage(control, show);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);

    // Un profesor inactivo no puede tener asignaturas: se valida antes de llamar a la API.
    const inactive = this.inactiveTeacher();
    if (inactive && this.form.controls.teacherId.value === inactive.id) {
      this.form.controls.teacherId.setErrors({ server: 'El profesor está inactivo. Asigna un docente activo.' });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.host.nativeElement.querySelector<HTMLElement>('.input-invalid')?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const dto = { ...raw, name: raw.name.trim(), code: raw.code.trim(), credits: Number(raw.credits), teacherId: Number(raw.teacherId) };
    const current = this.subject();
    const request$ = current ? this.service.update(current.id, dto) : this.service.create(dto);

    this.saving.set(true);
    request$.subscribe({
      next: (subject) => {
        this.saving.set(false);
        this.saved.emit({ subject, created: !current });
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        // 409: código duplicado · 422: profesor inactivo · 404: profesor inexistente
        let assigned = applyApiErrors(this.form, err, [
          { match: 'código', field: 'code', message: 'Ya existe una asignatura con este código.' },
        ]);
        if (!assigned && (err.status === 422 || (err.status === 404 && err.detail.toLowerCase().includes('profesor')))) {
          this.form.controls.teacherId.setErrors({ server: err.status === 422 ? 'El profesor está inactivo. Asigna un docente activo.' : 'El profesor seleccionado ya no existe.' });
          assigned = true;
        }
        if (!assigned) this.formError.set(err.detail);
      },
    });
  }
}
