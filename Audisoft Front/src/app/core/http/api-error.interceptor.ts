import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError, ProblemDetails } from '../models/api.models';

/** Traduce cualquier error HTTP a un ApiError con mensajes en español. */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));

function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new ApiError(-1, 'Error inesperado', 'Ocurrió un error inesperado en la aplicación.');
  }

  if (error.status === 0) {
    return new ApiError(
      0,
      'Sin conexión con el servidor',
      'No fue posible conectar con la API. Verifica que el servicio esté en ejecución.',
    );
  }

  const body = (typeof error.error === 'object' && error.error) as ProblemDetails | null;
  const fieldErrors = normalizeFieldErrors(body?.errors);

  return new ApiError(
    error.status,
    body?.title ?? 'Error en la solicitud',
    body?.detail ?? defaultDetail(error.status, fieldErrors),
    fieldErrors,
    body?.traceId,
  );
}

/** "Email" → "email", "$.fechaMatricula" → "fechaMatricula". */
function normalizeFieldErrors(errors?: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const clean = key.replace(/^\$\./, '');
    result[clean.charAt(0).toLowerCase() + clean.slice(1)] = messages;
  }
  return result;
}

function defaultDetail(status: number, fieldErrors: Record<string, string[]>): string {
  if (status === 400 && Object.keys(fieldErrors).length) return 'Revisa los campos marcados.';
  if (status === 404) return 'El registro solicitado ya no existe.';
  if (status >= 500) return 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
  return 'No fue posible completar la solicitud.';
}
