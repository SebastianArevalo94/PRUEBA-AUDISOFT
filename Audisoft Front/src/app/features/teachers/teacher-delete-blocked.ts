import { Component, computed, input, output } from '@angular/core';

import { Subject } from '../../core/models/subject.models';

/**
 * Diálogo informativo cuando la API no permite eliminar al profesor:
 * tiene asignaturas a cargo (se listan) o tiene notas registradas (se muestra el motivo de la API).
 */
@Component({
  selector: 'app-teacher-delete-blocked',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" (click)="closed.emit()"></div>
      <div
        class="panel relative w-full max-w-[560px] rounded-xl bg-surface-container-lowest p-7 shadow-overlay ring-1 ring-outline-variant/40"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="blocked-title"
        aria-describedby="blocked-message"
      >
        <button type="button" class="btn-icon absolute top-5 right-5 hover:text-on-surface" aria-label="Cerrar" (click)="closed.emit()">
          <span class="icon">close</span>
        </button>

        <div class="flex gap-4 pr-8">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
            <span class="icon icon-filled text-[28px]">warning</span>
          </div>
          <div>
            <h2 id="blocked-title" class="text-headline-md text-on-surface">No es posible eliminar</h2>
            <p id="blocked-message" class="mt-2 text-body-lg text-on-surface-variant">
              @if (subjects().length > 0) {
                {{ name() }} tiene
                <strong class="font-semibold text-on-surface">{{ subjects().length }} {{ subjects().length === 1 ? 'asignatura' : 'asignaturas' }} a cargo</strong>
                ({{ subjectNames() }}). Reasígnalas a otro docente antes de eliminarlo.
              } @else {
                {{ message() }}
              }
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-start gap-3 rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
          <span class="icon text-[20px] text-primary">info</span>
          <span>
            @if (subjects().length > 0) {
              Para garantizar la continuidad académica, ninguna asignatura puede quedar sin un docente asignado.
            } @else {
              Las notas conservan el registro del docente que las calificó, por eso no se puede eliminar.
              Si ya no dicta clases, puedes marcarlo como inactivo.
            }
          </span>
        </div>

        <div class="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          @if (subjects().length > 0) {
            <button type="button" class="btn btn-secondary" (click)="viewSubjects.emit()">
              <span class="icon text-[18px]">menu_book</span>
              Ver asignaturas
            </button>
          } @else {
            <button type="button" class="btn btn-secondary" (click)="deactivate.emit()">
              <span class="icon text-[18px]">person_off</span>
              Marcar como inactivo
            </button>
          }
          <button type="button" class="btn btn-primary" (click)="closed.emit()">Entendido</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .backdrop { animation: fade 200ms ease-out; }
    .panel { animation: pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1); }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { transform: scale(0.97); opacity: 0; } }
  `,
})
export class TeacherDeleteBlocked {
  readonly name = input.required<string>();
  readonly subjects = input<Subject[]>([]);
  /** Motivo devuelto por la API cuando el bloqueo no se debe a asignaturas (p. ej. notas registradas). */
  readonly message = input('');

  readonly closed = output<void>();
  readonly viewSubjects = output<void>();
  readonly deactivate = output<void>();

  protected readonly subjectNames = computed(() => {
    const names = this.subjects().map((a) => a.name);
    return names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} y ${names.length - 3} más`;
  });
}
