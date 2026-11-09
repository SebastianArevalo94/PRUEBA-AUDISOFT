import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';

import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  host: { '(document:keydown.escape)': 'pending() && confirm.close(false)' },
  template: `
    @if (pending(); as p) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" (click)="confirm.close(false)"></div>
        <div
          class="relative w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-overlay ring-1 ring-outline-variant/40"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div class="flex gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              [class]="p.tone === 'primary' ? 'bg-primary-fixed text-primary' : 'bg-error-container text-error'"
            >
              <span class="icon">{{ p.tone === 'primary' ? 'help' : 'warning' }}</span>
            </div>
            <div>
              <h2 id="confirm-title" class="text-headline-sm text-on-surface">{{ p.title }}</h2>
              <p id="confirm-message" class="mt-1 text-body-md text-on-surface-variant">{{ p.message }}</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button #cancelButton type="button" class="btn btn-secondary" (click)="confirm.close(false)">
              {{ p.cancelText ?? 'Cancelar' }}
            </button>
            <button type="button" class="btn" [class]="p.tone === 'primary' ? 'btn-primary' : 'btn-danger'" (click)="confirm.close(true)">
              {{ p.confirmText ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  protected readonly pending = this.confirm.pending;
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  constructor() {
    // El foco inicial va a "Cancelar": una acción destructiva nunca debe quedar a un Enter de distancia.
    effect(() => this.cancelButton()?.nativeElement.focus());
  }
}
