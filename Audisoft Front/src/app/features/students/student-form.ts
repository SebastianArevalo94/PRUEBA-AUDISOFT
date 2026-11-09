import { Component, ElementRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/models/api.models';
import { Student } from '../../core/models/student.models';
import { StudentsService } from '../../core/services/students.service';
import { Drawer } from '../../shared/ui/drawer';
import { applyApiErrors, controlErrorMessage } from '../../shared/utils/form-errors';
import { todayIso } from '../../shared/utils/format';

type Field = 'firstName' | 'lastName' | 'email' | 'studentCode' | 'enrollmentDate';

@Component({
  selector: 'app-student-form',
  imports: [ReactiveFormsModule, Drawer],
  templateUrl: './student-form.html',
})
export class StudentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StudentsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** null = crear; con valor = editar. */
  readonly student = input<Student | null>(null);
  readonly saved = output<{ student: Student; created: boolean }>();
  readonly cancelled = output<void>();

  protected readonly isEdit = computed(() => this.student() !== null);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  /** Error general de la API que no corresponde a un campo concreto. */
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    studentCode: ['', [Validators.required, Validators.maxLength(20)]],
    enrollmentDate: [todayIso(), Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    const e = this.student();
    if (e) {
      this.form.setValue({
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        studentCode: e.studentCode,
        enrollmentDate: e.enrollmentDate.substring(0, 10),
        isActive: e.isActive,
      });
    }
    queueMicrotask(() => this.host.nativeElement.querySelector('input')?.focus());
  }

  protected toUpper(control: AbstractControl): void {
    const value = String(control.value ?? '');
    if (value !== value.toUpperCase()) control.setValue(value.toUpperCase(), { emitEvent: false });
  }

  /** Mensaje de error de un campo (vacío si es válido o aún no se ha tocado). */
  protected errorOf(field: Field): string {
    const control = this.form.controls[field];
    return controlErrorMessage(control, control.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.host.nativeElement.querySelector<HTMLElement>('.input-invalid')?.focus();
      return;
    }

    const { isActive, ...data } = this.form.getRawValue();
    const current = this.student();
    const request$ = current ? this.service.update(current.id, { ...data, isActive }) : this.service.create(data);

    this.saving.set(true);
    request$.subscribe({
      next: (student) => {
        this.saving.set(false);
        this.saved.emit({ student, created: !current });
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        // 409 por valores únicos: "Ya existe un estudiante con el email …" / "… con el código …"
        const assigned = applyApiErrors(this.form, err, [
          { match: 'email', field: 'email', message: 'Ya existe un estudiante con este correo electrónico.' },
          { match: 'código', field: 'studentCode', message: 'Ya existe un estudiante con este código estudiantil.' },
        ]);
        if (!assigned) this.formError.set(err.detail);
      },
    });
  }
}
