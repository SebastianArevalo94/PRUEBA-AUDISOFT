import { Component, input, output } from '@angular/core';

/** Ventana modal centrada de solo lectura (p. ej. el promedio del estudiante). */
@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div class="backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" (click)="closed.emit()"></div>
      <section
        class="panel relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-overlay ring-1 ring-outline-variant/40"
        [style.max-width.px]="maxWidth()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <header class="flex items-center justify-between gap-4 border-b border-outline-variant/40 px-6 py-4">
          <h2 class="text-headline-md text-on-surface">{{ title() }}</h2>
          <button type="button" class="btn-icon hover:text-on-surface" aria-label="Cerrar" (click)="closed.emit()">
            <span class="icon">close</span>
          </button>
        </header>
        <div class="overflow-y-auto">
          <ng-content />
        </div>
      </section>
    </div>
  `,
  styles: `
    .backdrop { animation: fade 200ms ease-out; }
    .panel { animation: pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1); }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { transform: scale(0.97); opacity: 0; } }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly maxWidth = input(720);
  readonly closed = output<void>();
}
