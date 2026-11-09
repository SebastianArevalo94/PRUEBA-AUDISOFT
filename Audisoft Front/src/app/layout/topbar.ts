import { Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  host: { '(document:keydown)': 'onShortcut($event)' },
  template: `
    <header
      class="flex h-16 items-center justify-between gap-4 bg-surface-container-lowest/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-6"
    >
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <button type="button" class="btn-icon hover:text-on-surface lg:hidden" aria-label="Abrir menú" (click)="menu.emit()">
          <span class="icon">menu</span>
        </button>

        <nav aria-label="Migas de pan" class="hidden items-center gap-1 text-body-sm text-on-surface-variant xl:flex">
          <a routerLink="/" class="hover:text-on-surface">Gestión Académica</a>
          <span class="icon text-[16px]">chevron_right</span>
          <span class="font-medium text-on-surface">{{ breadcrumb() }}</span>
        </nav>

        <form class="relative w-full max-w-md" role="search" (submit)="search($event)">
          <span class="icon pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            #searchInput
            name="q"
            type="search"
            class="input pl-10 text-body-sm sm:pr-16"
            placeholder="Buscar estudiantes…"
            aria-label="Buscar estudiantes"
            aria-keyshortcuts="Control+K"
          />
          <kbd class="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-outline-variant/60 px-1.5 font-sans text-caption text-on-surface-variant sm:block">
            Ctrl K
          </kbd>
        </form>
      </div>

      <div class="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          class="btn-icon hover:text-on-surface"
          [attr.aria-label]="theme.dark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          [title]="theme.dark() ? 'Modo claro' : 'Modo oscuro'"
          (click)="theme.toggle()"
        >
          <span class="icon">{{ theme.dark() ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        <div class="flex items-center gap-3 pl-1">
          <div class="hidden flex-col text-right sm:flex">
            <span class="text-label-sm text-on-surface">Administrador</span>
            <span class="text-caption text-on-surface-variant">Coordinación académica</span>
          </div>
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-label-sm text-primary ring-2 ring-primary-fixed">
            AD
          </span>
        </div>
      </div>
    </header>
  `,
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly theme = inject(ThemeService);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  readonly menu = output<void>();

  /** Toma `data.breadcrumb` de la ruta activa más profunda. */
  protected readonly breadcrumb = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let current = this.route.snapshot;
        while (current.firstChild) current = current.firstChild;
        return (current.data['breadcrumb'] as string | undefined) ?? '';
      }),
    ),
    { initialValue: '' },
  );

  protected search(event: Event): void {
    event.preventDefault();
    const input = this.searchInput().nativeElement;
    const term = input.value.trim();
    this.router.navigate(['/students'], { queryParams: { search: term || null, page: null } });
    input.blur();
  }

  protected onShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput().nativeElement.focus();
    }
  }
}
