import { Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { environment } from '../../environments/environment';
import { ApiHealthService } from '../core/services/api-health.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full flex-col justify-between">
      <div class="flex flex-col">
        <a routerLink="/" class="flex h-16 items-center gap-3 px-4" (click)="navigate.emit()">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
            <span class="icon icon-filled">school</span>
          </span>
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-headline-sm text-on-surface">Gestión Académica</span>
            <span class="truncate text-caption text-on-surface-variant">Periodo {{ year }}</span>
          </span>
        </a>

        <nav class="flex flex-col gap-1 p-2" aria-label="Navegación principal">
          @for (item of items; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="nav-active"
              #rla="routerLinkActive"
              [attr.aria-current]="rla.isActive ? 'page' : null"
              class="nav-link"
              (click)="navigate.emit()"
            >
              <span class="icon" [class.icon-filled]="rla.isActive">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <div class="flex flex-col gap-2 p-2">
        <div class="flex flex-col gap-1 rounded-xl bg-surface-container-low p-3">
          <div class="flex items-center justify-between">
            <span class="text-caption text-on-surface-variant uppercase">Estado del sistema</span>
            <span class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium" [class]="status().badge">
              <span class="h-1.5 w-1.5 rounded-full" [class]="status().dot"></span>
              {{ status().label }}
            </span>
          </div>
          <span class="text-label-sm text-on-surface">{{ status().title }}</span>
          <p class="text-caption text-on-surface-variant">{{ status().detail }}</p>
        </div>
        <a
          [href]="swaggerUrl"
          target="_blank"
          rel="noopener"
          class="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <span class="icon text-[18px]">help</span>
          Documentación de la API
        </a>
      </div>
    </div>
  `,
  styles: `
    @reference '../../styles.css';
    .nav-link {
      @apply relative flex h-10 items-center gap-3 rounded-lg px-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface;
    }
    .nav-active {
      @apply bg-primary-fixed font-semibold text-primary hover:bg-primary-fixed hover:text-primary;
    }
    .nav-active::before {
      content: '';
      @apply absolute top-2 bottom-2 left-0 w-1 rounded-r bg-primary;
    }
  `,
})
export class Sidebar {
  private readonly health = inject(ApiHealthService);
  readonly navigate = output<void>();

  protected readonly year = new Date().getFullYear();
  protected readonly swaggerUrl = environment.swaggerUrl;

  protected readonly items: NavItem[] = [
    { path: '/home', label: 'Inicio', icon: 'dashboard' },
    { path: '/students', label: 'Estudiantes', icon: 'school' },
    { path: '/teachers', label: 'Profesores', icon: 'badge' },
    { path: '/subjects', label: 'Asignaturas', icon: 'menu_book' },
    { path: '/grades', label: 'Notas', icon: 'grade' },
  ];

  protected readonly status = computed(() => {
    const check = this.health.lastCheck();
    const time = check ? check.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
    switch (this.health.status()) {
      case 'online':
        return {
          label: 'Activo', title: 'API conectada', detail: `Última verificación: ${time}`,
          badge: 'bg-secondary-fixed text-on-secondary-fixed', dot: 'bg-secondary',
        };
      case 'offline':
        return {
          label: 'Caído', title: 'API sin conexión', detail: 'Verifica que el servicio esté en ejecución',
          badge: 'bg-error-container text-on-error-container', dot: 'bg-error',
        };
      default:
        return {
          label: '…', title: 'Verificando conexión', detail: 'Consultando la API',
          badge: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline',
        };
    }
  });
}
