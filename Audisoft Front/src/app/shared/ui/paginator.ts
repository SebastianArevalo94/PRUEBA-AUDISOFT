import { Component, computed, input, output } from '@angular/core';

type PageItem = number | 'gap';

@Component({
  selector: 'app-paginator',
  template: `
    <footer class="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 px-5 py-4 sm:flex-row">
      <p class="text-body-sm text-on-surface-variant tabular">
        @if (totalCount() > 0) {
          Mostrando <span class="font-semibold text-on-surface">{{ from() }}–{{ to() }}</span>
          de <span class="font-semibold text-on-surface">{{ totalCount() }}</span>
          @if (itemLabel()) { {{ itemLabel() }} }
        } @else {
          Sin resultados
        }
      </p>

      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <label class="flex items-center gap-2 text-body-sm text-on-surface-variant">
          Filas por página:
          <span class="relative">
            <select
              class="h-8 cursor-pointer appearance-none rounded-md bg-surface pr-7 pl-2.5 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
              [value]="pageSize()"
              (change)="pageSizeChange.emit(+$any($event.target).value)"
            >
              @for (size of pageSizeOptions(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
            <span class="icon pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-[16px] text-on-surface-variant">expand_more</span>
          </span>
        </label>

        <nav aria-label="Paginación" class="flex items-center gap-1">
          <button type="button" class="page-btn" aria-label="Página anterior" [disabled]="page() <= 1" (click)="go(page() - 1)">
            <span class="icon text-[18px]">chevron_left</span>
          </button>

          <!-- Escritorio: números de página -->
          <span class="hidden items-center gap-1 sm:flex">
            @for (item of items(); track $index) {
              @if (item === 'gap') {
                <span class="w-8 text-center text-on-surface-variant">…</span>
              } @else {
                <button
                  type="button"
                  class="page-btn tabular"
                  [class.page-btn-active]="item === page()"
                  [attr.aria-current]="item === page() ? 'page' : null"
                  [attr.aria-label]="'Página ' + item"
                  (click)="go(item)"
                >
                  {{ item }}
                </button>
              }
            }
          </span>
          <!-- Móvil: "Página X de Y" -->
          <span class="px-2 text-body-sm text-on-surface-variant tabular sm:hidden">
            Página {{ page() }} de {{ lastPage() }}
          </span>

          <button type="button" class="page-btn" aria-label="Página siguiente" [disabled]="page() >= lastPage()" (click)="go(page() + 1)">
            <span class="icon text-[18px]">chevron_right</span>
          </button>
        </nav>
      </div>
    </footer>
  `,
  styles: `
    @reference '../../../styles.css';
    .page-btn {
      @apply flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent;
    }
    .page-btn-active {
      @apply bg-primary text-on-primary shadow-sm hover:bg-primary hover:text-on-primary;
    }
  `,
})
export class Paginator {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSizeOptions = input([10, 25, 50]);
  /** Texto opcional tras el total: "Mostrando 1–10 de 48 profesores". */
  readonly itemLabel = input('');

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly lastPage = computed(() => Math.max(1, this.totalPages()));
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));

  /** Ventana de páginas: 1 … 4 5 [6] 7 8 … 20 */
  protected readonly items = computed<PageItem[]>(() => {
    const total = this.lastPage();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    const pages: PageItem[] = [1];
    if (start > 2) pages.push('gap');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total - 1) pages.push('gap');
    pages.push(total);
    return pages;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.lastPage() && page !== this.page()) this.pageChange.emit(page);
  }
}
