import { Component, ElementRef, afterNextRender, computed, effect, inject, Injector, input, output, signal } from '@angular/core';

import { formatShortDate } from '../utils/format';

export type DateFilterMode = 'day' | 'range';

/** Rango de fechas yyyy-MM-dd ('' = sin límite). Un día puntual es desde = hasta. */
export interface DateRange {
  from: string;
  to: string;
}

/** Día puntual si no hay filtro o si desde = hasta; rango en cualquier otro caso. */
function inferMode(from: string, to: string): DateFilterMode {
  return (from || to) && from !== to ? 'range' : 'day';
}

/**
 * Filtro de fecha con dos modos: **Día** (un campo; emite desde = hasta) o **Rango** (el campo se
 * expande para mostrar la fecha final). Al cambiar de modo conserva lo elegido:
 * día → rango deja el día como inicio y fin; rango → día toma la fecha inicial.
 *
 * Uso: `<app-date-filter fieldLabel="Matrícula" verb="Matriculados" [from]="…" [to]="…" (rangeChange)="…" />`
 */
@Component({
  selector: 'app-date-filter',
  host: { class: 'block w-full sm:w-auto' },
  template: `
    @let isRange = mode() === 'range';
    <fieldset class="flex flex-col gap-1" [attr.aria-describedby]="hasValue() ? id + '-label' : null">
      <legend class="sr-only">Fecha de {{ fieldLabelLower() }}</legend>
      @if (hasValue()) { <span [id]="id + '-label'" class="sr-only">{{ summary() }}</span> }
      <div
        class="flex h-10 items-center gap-1 rounded-lg border bg-surface pr-1 pl-1 transition-colors"
        [class]="error() ? 'border-danger' : hasValue() ? 'border-primary-container/60' : 'border-transparent'"
      >
        <!-- Selector de modo -->
        <div class="flex shrink-0 rounded-md bg-surface-container p-0.5" role="radiogroup" [attr.aria-label]="'Filtrar ' + fieldLabelLower() + ' por'">
          @for (m of modes; track m.value) {
            @let active = mode() === m.value;
            <button
              type="button"
              role="radio"
              class="rounded px-2 py-1 text-caption font-semibold transition-colors"
              [class]="active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
              [attr.aria-checked]="active"
              [title]="m.value === 'day' ? verb() + ' en un día específico' : verb() + ' entre dos fechas'"
              (click)="setMode(m.value)"
            >
              {{ m.label }}
            </button>
          }
        </div>

        <span class="icon ml-1 text-[20px] text-on-surface-variant" aria-hidden="true">event</span>

        <!-- Día (modo día) o fecha inicial (modo rango): es el mismo campo -->
        <label class="sr-only" [for]="id + '-from'">{{ isRange ? fieldLabel() + ' desde' : 'Día de ' + fieldLabelLower() }}</label>
        <input
          #fromInput
          [id]="id + '-from'"
          type="date"
          class="h-8 min-w-0 flex-1 rounded bg-transparent px-1 text-body-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30 sm:w-[132px] sm:flex-none"
          [title]="isRange ? fieldLabel() + ' desde' : 'Día de ' + fieldLabelLower()"
          [value]="from()"
          [max]="isRange ? to() || null : null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="id + '-error'"
          (change)="isRange ? onRange('from', fromInput) : onDay(fromInput)"
        />

        <!-- Fecha final: solo en modo rango; se expande/contrae animando el ancho de la columna -->
        <div
          class="grid min-w-0 transition-[grid-template-columns,opacity] duration-300 ease-out motion-reduce:transition-none"
          [class]="isRange ? 'flex-1 grid-cols-[1fr] opacity-100 sm:flex-none' : 'grid-cols-[0fr] opacity-0'"
          [attr.inert]="isRange ? null : ''"
          [attr.aria-hidden]="isRange ? null : 'true'"
        >
          <div class="flex min-w-0 items-center gap-1 overflow-hidden">
            <span class="text-body-sm text-on-surface-variant" aria-hidden="true">–</span>
            <label class="sr-only" [for]="id + '-to'">{{ fieldLabel() }} hasta</label>
            <input
              #toInput
              [id]="id + '-to'"
              type="date"
              class="h-8 min-w-0 flex-1 rounded bg-transparent px-1 text-body-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30 sm:w-[132px] sm:flex-none"
              [title]="fieldLabel() + ' hasta'"
              [value]="to()"
              [min]="from() || null"
              [attr.aria-invalid]="!!error() || null"
              [attr.aria-describedby]="id + '-error'"
              (change)="onRange('to', toInput)"
            />
          </div>
        </div>

        @if (hasValue()) {
          <button type="button" class="btn-icon shrink-0 p-1 hover:text-on-surface" [attr.aria-label]="'Quitar filtro de fecha de ' + fieldLabelLower()" (click)="clear()">
            <span class="icon text-[18px]">close</span>
          </button>
        }
      </div>
      @if (error(); as msg) {
        <p [id]="id + '-error'" class="field-error mt-0" role="alert"><span class="icon text-[16px]">error</span>{{ msg }}</p>
      }
    </fieldset>
  `,
})
export class DateFilter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Nombre del campo con mayúscula inicial: "Matrícula", "Registro". */
  readonly fieldLabel = input.required<string>();
  /** Participio para los textos de ayuda: "Matriculados", "Registrados". */
  readonly verb = input.required<string>();
  readonly from = input('');
  readonly to = input('');
  /** Prefijo de los id de los campos (debe ser único en la página). */
  readonly idPrefix = input('date');
  readonly rangeChange = output<DateRange>();

  protected readonly modes: { value: DateFilterMode; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'range', label: 'Rango' },
  ];
  protected readonly mode = signal<DateFilterMode>('day');
  protected readonly error = signal<string | null>(null);
  protected readonly hasValue = computed(() => !!this.from() || !!this.to());
  protected readonly fieldLabelLower = computed(() => this.fieldLabel().toLowerCase());
  protected get id(): string {
    return this.idPrefix();
  }

  /** Texto accesible del filtro aplicado, p. ej. "Matriculados el 23 ene 2023". */
  protected readonly summary = computed(() => {
    const [from, to, verb] = [this.from(), this.to(), this.verb()];
    if (from && from === to) return `${verb} el ${formatShortDate(from)}`;
    if (from && to) return `${verb} entre el ${formatShortDate(from)} y el ${formatShortDate(to)}`;
    if (from) return `${verb} desde el ${formatShortDate(from)}`;
    if (to) return `${verb} hasta el ${formatShortDate(to)}`;
    return '';
  });

  constructor() {
    // El modo se deduce de los valores (p. ej. al entrar desde una URL). Un rango real
    // (fechas distintas o un solo extremo) siempre se muestra expandido; si se limpia, se conserva el modo.
    effect(() => {
      if (inferMode(this.from(), this.to()) === 'range') this.mode.set('range');
    });
  }

  protected onDay(input: HTMLInputElement): void {
    // Una fecha a medio escribir llega vacía pero con badInput: se espera a que esté completa.
    if (!input.value && input.validity.badInput) return;
    this.error.set(null);
    this.rangeChange.emit({ from: input.value, to: input.value });
  }

  protected onRange(edge: 'from' | 'to', input: HTMLInputElement): void {
    if (!input.value && input.validity.badInput) return;
    const next: DateRange = { from: this.from(), to: this.to(), [edge]: input.value };
    if (next.from && next.to && next.from > next.to) {
      this.error.set('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    this.error.set(null);
    this.rangeChange.emit(next);
  }

  protected clear(): void {
    this.error.set(null);
    this.rangeChange.emit({ from: '', to: '' });
  }

  protected setMode(mode: DateFilterMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.error.set(null);
    const [from, to] = [this.from(), this.to()];
    if (mode === 'day' && (from || to) && from !== to) {
      const day = from || to;
      this.rangeChange.emit({ from: day, to: day });
    }
    // Foco al campo que acaba de aparecer o al único que queda (tras el render, cuando ya no es inert).
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLInputElement>(`#${this.id}-${mode === 'range' ? 'to' : 'from'}`)?.focus(),
      { injector: this.injector },
    );
  }

  /** Permite al padre limpiar el error al restablecer filtros. */
  resetError(): void {
    this.error.set(null);
  }
}
