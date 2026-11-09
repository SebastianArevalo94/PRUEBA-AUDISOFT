import { AbstractControl, FormGroup } from '@angular/forms';

import { ApiError } from '../../core/models/api.models';

/** Mensaje en español para el primer error de un control ('' si es válido o aún no debe mostrarse). */
export function controlErrorMessage(control: AbstractControl, show: boolean): string {
  if (!control.errors || !show) return '';
  const e = control.errors;
  if (e['server']) return e['server'];
  if (e['required']) return 'Este campo es obligatorio.';
  if (e['email']) return 'Ingresa un correo electrónico válido.';
  if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
  if (e['max']) return `El valor máximo es ${e['max'].max}.`;
  if (e['pattern']) return 'Formato no válido.';
  return 'Valor no válido.';
}

/** Regla para llevar un 409 de la API a un campo: si `detail` contiene `match`, se marca `field`. */
export interface ConflictRule {
  match: string;
  field: string;
  message: string;
}

/**
 * Asigna los errores de la API a los controles del formulario (validación 400 por campo y
 * conflictos 409 según `conflicts`). Devuelve false si el error no corresponde a ningún campo.
 */
export function applyApiErrors(form: FormGroup, err: ApiError, conflicts: ConflictRule[] = []): boolean {
  let assigned = false;

  for (const [field, messages] of Object.entries(err.fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: messages[0] });
      assigned = true;
    }
  }

  if (err.status === 409) {
    const detail = err.detail.toLowerCase();
    const rule = conflicts.find((r) => detail.includes(r.match));
    const control = rule && form.get(rule.field);
    if (rule && control) {
      control.setErrors({ server: rule.message });
      assigned = true;
    }
  }

  return assigned;
}
