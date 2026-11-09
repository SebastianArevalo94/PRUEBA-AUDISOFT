import { Component, computed, input } from '@angular/core';

import { initials } from '../utils/format';

/** Paleta rotativa de avatares tomada del diseño de Stitch. */
const PALETTE = [
  'bg-primary-fixed text-primary',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
  'bg-primary-fixed-dim text-on-primary-fixed-variant',
  'bg-secondary-fixed-dim text-on-secondary-fixed',
  'bg-tertiary-fixed-dim text-on-tertiary-fixed',
];

@Component({
  selector: 'app-avatar',
  host: { class: 'shrink-0' },
  template: `
    <div
      class="flex items-center justify-center rounded-full font-semibold"
      [class]="colorClass()"
      [class.h-9]="size() === 'md'" [class.w-9]="size() === 'md'" [class.text-label-sm]="size() === 'md'"
      [class.h-14]="size() === 'lg'" [class.w-14]="size() === 'lg'" [class.text-headline-sm]="size() === 'lg'"
      aria-hidden="true"
    >
      {{ text() }}
    </div>
  `,
})
export class Avatar {
  readonly firstName = input.required<string>();
  readonly lastName = input('');
  /** Semilla estable para el color (normalmente el id). */
  readonly seed = input(0);
  /** Los registros inactivos se muestran en gris. */
  readonly muted = input(false);
  readonly size = input<'md' | 'lg'>('md');

  protected readonly text = computed(() => initials(this.firstName(), this.lastName()));
  protected readonly colorClass = computed(() =>
    this.muted() ? 'bg-surface-container-high text-on-surface-variant' : PALETTE[Math.abs(this.seed()) % PALETTE.length],
  );
}
