import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/models/api.models';
import { Subject } from '../../core/models/subject.models';
import { Teacher } from '../../core/models/teacher.models';
import { TeachersService } from '../../core/services/teachers.service';

/** Panel de la fila expandida: asignaturas a cargo del profesor (se cargan al abrirlo). */
@Component({
  selector: 'app-teacher-subjects-panel',
  imports: [RouterLink],
  template: `
    <div class="rounded-xl bg-surface-container-lowest p-5 shadow-card ring-1 ring-outline-variant/30">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="icon text-primary">auto_stories</span>
          <h3 class="text-headline-sm text-on-surface">
            Asignaturas a cargo
            @if (subjects(); as list) { ({{ list.length }}) }
          </h3>
        </div>
        <a
          routerLink="/subjects"
          [queryParams]="{ teacherId: teacher().id }"
          class="flex items-center gap-1 text-label-sm text-primary hover:underline"
        >
          Ver en Asignaturas
          <span class="icon text-[16px]">arrow_forward</span>
        </a>
      </div>

      @if (error(); as err) {
        <p class="flex items-center gap-2 text-body-sm text-danger" role="alert">
          <span class="icon text-[18px]">error</span>{{ err.detail }}
        </p>
      } @else if (!subjects()) {
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          @for (_ of [1, 2, 3].slice(0, skeletons()); track $index) {
            <span class="skeleton h-[104px]"></span>
          }
        </div>
      } @else if (subjects()!.length === 0) {
        <p class="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span class="icon text-[18px]">info</span>
          Este profesor aún no tiene asignaturas a cargo.
        </p>
      } @else {
        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          @for (a of subjects(); track a.id) {
            <li class="flex flex-col gap-3 rounded-lg bg-surface-container-low p-4">
              <span class="self-start rounded bg-primary-fixed px-2 py-0.5 font-mono text-label-sm text-primary">{{ a.code }}</span>
              <span class="text-label-md font-semibold text-on-surface">{{ a.name }}</span>
              <span class="flex items-center gap-1 text-caption text-on-surface-variant">
                <span class="icon text-[16px]">school</span>
                {{ a.credits }} {{ a.credits === 1 ? 'crédito' : 'créditos' }}
              </span>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class TeacherSubjectsPanel implements OnInit {
  private readonly service = inject(TeachersService);

  readonly teacher = input.required<Teacher>();

  protected readonly subjects = signal<Subject[] | null>(null);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly skeletons = () => Math.min(3, Math.max(1, this.teacher().subjectCount));

  ngOnInit(): void {
    this.service.subjects(this.teacher().id).subscribe({
      next: (list) => this.subjects.set(list),
      error: (err: ApiError) => this.error.set(err),
    });
  }
}
