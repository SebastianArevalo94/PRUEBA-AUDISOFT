import { Component, input, output } from '@angular/core';

/** Panel lateral derecho para formularios de crear/editar. El contenido se proyecta. */
@Component({
  selector: 'app-drawer',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-[55] flex justify-end">
      <div class="backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" (click)="closed.emit()"></div>
      <aside
        class="panel relative flex h-full w-full max-w-[480px] flex-col bg-surface-container-lowest shadow-overlay"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <header class="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-6 py-5">
          <div>
            <h2 class="text-headline-md text-on-surface">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="mt-0.5 text-body-sm text-on-surface-variant">{{ subtitle() }}</p>
            }
          </div>
          <button type="button" class="btn-icon hover:text-on-surface" aria-label="Cerrar" (click)="closed.emit()">
            <span class="icon">close</span>
          </button>
        </header>
        <ng-content />
      </aside>
    </div>
  `,
  styles: `
    .backdrop { animation: fade 200ms ease-out; }
    .panel { animation: slide 260ms cubic-bezier(0.2, 0.8, 0.2, 1); }
    @keyframes fade { from { opacity: 0; } }
    @keyframes slide { from { transform: translateX(32px); opacity: 0; } }
  `,
})
export class Drawer {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly closed = output<void>();
}
