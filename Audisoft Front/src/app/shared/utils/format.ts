const shortDate = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Convierte una fecha de la API a Date local. Las fechas llegan como "2026-11-06T23:38:22"
 * (sin zona) o "2026-11-06"; se toma solo el día para que no se desplace por la zona horaria.
 */
export function parseApiDate(value: string): Date {
  const [y, m, d] = value.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-11-06T…" → "06 nov 2026" */
export function formatShortDate(value: string | Date): string {
  const date = typeof value === 'string' ? parseApiDate(value) : value;
  const parts = shortDate.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month').replace('.', '')} ${get('year')}`;
}

/** Fecha de hoy en formato yyyy-MM-dd (input type="date"). */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "hace un momento", "hace 3 min", "hace 2 h" */
export function relativeTime(from: Date, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - from.getTime()) / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `hace ${hours} h` : `hace ${Math.floor(hours / 24)} d`;
}

/** Iniciales para el avatar: "Sofía Larraín" → "SL". */
export function initials(name: string, lastName = ''): string {
  return `${name.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
}

export type GradeTone = 'success' | 'warning' | 'danger';

/** Escala colombiana: < 3.0 reprobado, 3.0–3.9 aprobado, ≥ 4.0 sobresaliente. */
export function gradeTone(value: number): GradeTone {
  if (value < 3) return 'danger';
  if (value < 4) return 'warning';
  return 'success';
}

/** Nota con 1 decimal, o 2 si los tiene: 4 → "4.0", 4.25 → "4.25". */
export function formatGrade(value: number): string {
  return Number.isInteger(Math.round(value * 100) / 10) ? value.toFixed(1) : value.toFixed(2);
}

/** Porcentaje sin ceros sobrantes: 30 → "30%", 12.5 → "12.5%". */
export function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
