import { Injectable, signal } from '@angular/core';

/** Alterna el modo claro/oscuro (clase .dark en <html>) y lo recuerda en localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(document.documentElement.classList.contains('dark'));

  toggle(): void {
    const dark = !this.dark();
    this.dark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // Almacenamiento no disponible (modo privado): el tema solo dura la sesión.
    }
  }
}
