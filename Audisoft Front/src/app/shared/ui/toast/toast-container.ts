import { Component, inject } from '@angular/core';

import { ToastService, ToastType } from './toast.service';

const STYLES: Record<ToastType, { icon: string; circle: string }> = {
  success: { icon: 'check_circle', circle: 'bg-secondary-fixed/60 text-secondary' },
  error: { icon: 'error', circle: 'bg-error-container text-error' },
  info: { icon: 'info', circle: 'bg-primary-fixed text-primary' },
};

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="pointer-events-none fixed top-20 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-8">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="toast-enter pointer-events-auto flex items-start justify-between gap-3 rounded-lg bg-surface-container-lowest px-4 py-3 shadow-overlay ring-1 ring-outline-variant/40"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" [class]="styles[toast.type].circle">
              <span class="icon">{{ styles[toast.type].icon }}</span>
            </div>
            <div class="flex flex-col pt-0.5">
              <span class="text-label-md font-semibold text-on-surface">{{ toast.title }}</span>
              @if (toast.message) {
                <span class="text-body-sm text-on-surface-variant">{{ toast.message }}</span>
              }
            </div>
          </div>
          <button type="button" class="btn-icon -mr-1 hover:text-on-surface" aria-label="Cerrar notificación" (click)="toasts.dismiss(toast.id)">
            <span class="icon text-[18px]">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-enter {
      animation: toast-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class ToastContainer {
  protected readonly toasts = inject(ToastService);
  protected readonly styles = STYLES;
}
