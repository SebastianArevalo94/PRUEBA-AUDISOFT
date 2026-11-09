import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  template: `
    <!-- Fondo del menú en móvil/tablet -->
    @if (menuOpen()) {
      <div class="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" (click)="menuOpen.set(false)"></div>
    }

    <aside
      class="fixed top-0 left-0 z-50 h-full w-[248px] bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 lg:translate-x-0"
      [class.-translate-x-full]="!menuOpen()"
    >
      <app-sidebar (navigate)="menuOpen.set(false)" />
    </aside>

    <div class="lg:pl-[248px]">
      <app-topbar class="fixed top-0 right-0 left-0 z-30 lg:left-[248px]" (menu)="menuOpen.set(true)" />
      <main class="min-h-screen px-4 pt-24 pb-10 sm:px-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly menuOpen = signal(false);
}
