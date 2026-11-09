import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

import { Subject } from '../../core/models/subject.models';

/** Confirmación para eliminar una asignatura: advierte que también se eliminan sus notas. */
@Component({
  selector: 'app-subject-delete-dialog',
  host: { '(document:keydown.escape)': '!deleting() && cancelled.emit()' },
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" (click)="!deleting() && cancelled.emit()"></div>
      <div
        class="panel relative w-full max-w-[480px] rounded-xl bg-surface-container-lowest p-7 shadow-overlay ring-1 ring-outline-variant/40"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-message"
      >
        <div class="flex items-start justify-between">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
            <span class="icon text-[28px]">warning</span>
          </div>
          <button type="button" class="btn-icon hover:text-on-surface" aria-label="Cerrar" [disabled]="deleting()" (click)="cancelled.emit()">
            <span class="icon">close</span>
          </button>
        </div>

        <h2 id="delete-title" class="mt-5 text-headline-md text-on-surface">¿Eliminar {{ subject().name }}?</h2>
        <p id="delete-message" class="mt-2 text-body-lg text-on-surface-variant">
          También se eliminarán las notas registradas en esta asignatura. Esta acción no se puede deshacer.
        </p>

        <div class="mt-6 flex items-center gap-4 rounded-lg bg-surface-container-low px-4 py-3">
          <span class="shrink-0 rounded bg-primary-fixed px-2 py-0.5 font-mono text-label-sm text-primary">{{ subject().code }}</span>
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-label-md text-on-surface">{{ subject().name }}</span>
            <span class="truncate text-body-sm text-on-surface-variant">Docente: {{ subject().teacherName ?? 'Sin asignar' }}</span>
          </span>
        </div>

        <div class="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button #cancelButton type="button" class="btn btn-secondary" [disabled]="deleting()" (click)="cancelled.emit()">Cancelar</button>
          <button type="button" class="btn btn-danger min-w-32" [disabled]="deleting()" (click)="confirmed.emit()">
            <span class="icon text-[18px]" [class.animate-spin]="deleting()">{{ deleting() ? 'progress_activity' : 'delete' }}</span>
            {{ deleting() ? 'Eliminando…' : 'Eliminar' }}
          </button>
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
export class SubjectDeleteDialog {
  readonly subject = input.required<Subject>();
  readonly deleting = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  constructor() {
    // Foco inicial en "Cancelar": una acción destructiva nunca debe quedar a un Enter de distancia.
    afterNextRender(() => this.cancelButton()?.nativeElement.focus());
  }
}
