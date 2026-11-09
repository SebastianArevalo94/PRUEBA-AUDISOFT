import { Component, ElementRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/models/api.models';
import { Teacher } from '../../core/models/teacher.models';
import { TeachersService } from '../../core/services/teachers.service';
import { Drawer } from '../../shared/ui/drawer';
import { applyApiErrors, controlErrorMessage } from '../../shared/utils/form-errors';

type Field = 'firstName' | 'lastName' | 'email';

@Component({
  selector: 'app-teacher-form',
  imports: [ReactiveFormsModule, Drawer],
  templateUrl: './teacher-form.html',
})
export class TeacherForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TeachersService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** null = crear; con valor = editar. */
  readonly teacher = input<Teacher | null>(null);
  readonly saved = output<{ teacher: Teacher; created: boolean }>();
  readonly cancelled = output<void>();

  protected readonly isEdit = computed(() => this.teacher() !== null);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const p = this.teacher();
    if (p) this.form.setValue({ firstName: p.firstName, lastName: p.lastName, email: p.email, isActive: p.isActive });
    queueMicrotask(() => this.host.nativeElement.querySelector('input')?.focus());
  }

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
    const current = this.teacher();
    const request$ = current ? this.service.update(current.id, { ...data, isActive }) : this.service.create(data);

    this.saving.set(true);
    request$.subscribe({
      next: (teacher) => {
        this.saving.set(false);
        this.saved.emit({ teacher, created: !current });
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        // 409: "Ya existe un profesor con el email …"
        const assigned = applyApiErrors(this.form, err, [
          { match: 'email', field: 'email', message: 'Ya existe un profesor con este correo electrónico.' },
        ]);
        if (!assigned) this.formError.set(err.detail);
      },
    });
  }
}
