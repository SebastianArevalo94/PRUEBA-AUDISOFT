import { Pipe, PipeTransform } from '@angular/core';

import { formatShortDate } from '../utils/format';

/** {{ estudiante.fechaMatricula | shortDate }} → "06 nov 2026" */
@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return value ? formatShortDate(value) : '—';
  }
}
