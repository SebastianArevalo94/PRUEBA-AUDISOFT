import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';

import { StudentsService } from '../../core/services/students.service';

/** Estudiante elegido en el selector (lo mínimo para mostrarlo). */
export interface StudentOption {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

let nextId = 0;

/**
 * Combobox con búsqueda en el servidor (nombre, apellido, correo o código).
 * Accesible: role="combobox" + listbox, flechas, Enter y Escape.
 */
@Component({
  selector: 'app-student-picker',
  host: { class: 'block', '(document:click)': 'onDocumentClick($event)' },
  template: `
    <div class="relative">
      @if (value(); as v) {
        <div
          class="input flex items-center gap-2 pr-1"
          [class.input-invalid]="invalid()"
          [class.opacity-60]="disabled()"
        >
          <span class="icon text-[20px] text-on-surface-variant">person</span>
          <span class="flex min-w-0 flex-1 items-baseline gap-2">
            <span class="truncate text-on-surface">{{ v.name }}</span>
            <span class="shrink-0 font-mono text-caption text-on-surface-variant">{{ v.code }}</span>
          </span>
          @if (!disabled()) {
            <button type="button" class="btn-icon p-1 hover:text-on-surface" [attr.aria-label]="'Quitar a ' + v.name" (click)="clear()">
              <span class="icon text-[18px]">close</span>
            </button>
          }
        </div>
      } @else {
        <span class="icon pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-on-surface-variant">person_search</span>
        <input
          #input
          [id]="inputId()"
          type="text"
          role="combobox"
          autocomplete="off"
          class="input pr-8 pl-10"
          [class.input-invalid]="invalid()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="term()"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listId"
          [attr.aria-activedescendant]="open() && active() >= 0 ? listId + '-' + active() : null"
          [attr.aria-invalid]="invalid() || null"
          [attr.aria-describedby]="describedBy() || null"
          aria-autocomplete="list"
          (input)="onInput($any($event.target).value)"
          (focus)="openList()"
          (keydown)="onKeydown($event)"
        />
        <span class="icon pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-on-surface-variant" [class.animate-spin]="loading()">
          {{ loading() ? 'progress_activity' : 'expand_more' }}
        </span>
      }

      @if (open() && !value()) {
        <ul
          [id]="listId"
          role="listbox"
          class="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg bg-surface-container-lowest py-1 shadow-overlay ring-1 ring-outline-variant/40"
        >
          @for (o of options(); track o.id; let i = $index) {
            <li
              [id]="listId + '-' + i"
              role="option"
              [attr.aria-selected]="i === active()"
              class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-body-md"
              [class.bg-surface-container]="i === active()"
              (mouseenter)="active.set(i)"
              (mousedown)="$event.preventDefault(); select(o)"
            >
              <span class="truncate text-on-surface">{{ o.name }}</span>
              <span class="shrink-0 font-mono text-caption text-on-surface-variant">{{ o.code }}</span>
            </li>
          } @empty {
            <li class="px-3 py-3 text-body-sm text-on-surface-variant">
              {{ loading() ? 'Buscando…' : error() ? 'No fue posible buscar estudiantes.' : 'Ningún estudiante coincide.' }}
            </li>
          }
          @if (hasMore()) {
            <li class="border-t border-outline-variant/30 px-3 py-2 text-caption text-on-surface-variant">Escribe más para acotar la búsqueda…</li>
          }
        </ul>
      }
    </div>
  `,
})
export class StudentPicker {
  private readonly service = inject(StudentsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = input<StudentOption | null>(null);
  readonly placeholder = input('Buscar estudiante…');
  /** Solo estudiantes activos (al registrar notas). */
  readonly activeOnly = input(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly inputId = input(`estudiante-picker-${nextId}`);
  readonly describedBy = input('');
  readonly changed = output<StudentOption | null>();
  readonly touched = output<void>();

  protected readonly listId = `estudiante-list-${nextId++}`;
  protected readonly term = signal('');
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly options = signal<StudentOption[]>([]);
  protected readonly hasMore = signal(false);
  protected readonly active = signal(-1);
  private readonly search$ = new Subject<string>();
  private loaded = false;

  protected readonly count = computed(() => this.options().length);

  constructor() {
    this.search$
      .pipe(
        debounceTime(250),
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
        }),
        switchMap((search) =>
          this.service.list({ page: 1, pageSize: 8, search: search || undefined, isActive: this.activeOnly() ? true : undefined }).pipe(
            map((r) => ({ items: r.items, more: r.totalCount > r.items.length })),
            catchError(() => {
              this.error.set(true);
              return of({ items: [], more: false });
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ items, more }) => {
        this.loading.set(false);
        this.options.set(items.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.studentCode, isActive: e.isActive })));
        this.hasMore.set(more);
        this.active.set(items.length ? 0 : -1);
      });
  }

  protected openList(): void {
    this.open.set(true);
    if (!this.loaded) {
      this.loaded = true;
      this.search$.next(this.term().trim());
    }
  }

  protected onInput(value: string): void {
    this.term.set(value);
    this.open.set(true);
    this.loaded = true;
    this.search$.next(value.trim());
  }

  protected onKeydown(event: KeyboardEvent): void {
    const n = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) this.openList();
        else if (n) this.active.update((i) => (i + 1) % n);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (n) this.active.update((i) => (i <= 0 ? n - 1 : i - 1));
        break;
      case 'Enter':
        if (this.open() && this.active() >= 0 && this.options()[this.active()]) {
          event.preventDefault();
          this.select(this.options()[this.active()]);
        }
        break;
      case 'Escape':
        if (this.open()) {
          event.stopPropagation();
          this.close();
        }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected select(option: StudentOption): void {
    this.open.set(false);
    this.term.set('');
    this.loaded = false;
    this.changed.emit(option);
  }

  protected clear(): void {
    this.changed.emit(null);
    // Devuelve el foco al campo de búsqueda que reaparece.
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLInputElement>('input')?.focus());
  }

  private close(): void {
    if (this.open()) this.touched.emit();
    this.open.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
