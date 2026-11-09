import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateGradeDto, Grade, GradeFilter, GradeQuery, GradesPagedResult, GradesSummary, UpdateGradeDto } from '../models/grade.models';

@Injectable({ providedIn: 'root' })
export class GradesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/grades`;

  list(query: GradeQuery): Observable<GradesPagedResult> {
    const params = filtersToParams(query).set('page', query.page).set('pageSize', query.pageSize);
    return this.http.get<GradesPagedResult>(this.baseUrl, { params });
  }

  /** Indicadores calculados por la API para los mismos filtros del listado. */
  summary(filters: GradeFilter): Observable<GradesSummary> {
    return this.http.get<GradesSummary>(`${this.baseUrl}/summary`, { params: filtersToParams(filters) });
  }

  get(id: number): Observable<Grade> {
    return this.http.get<Grade>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateGradeDto): Observable<Grade> {
    return this.http.post<Grade>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateGradeDto): Observable<Grade> {
    return this.http.put<Grade>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

function filtersToParams(filters: GradeFilter): HttpParams {
  let params = new HttpParams();
  if (filters.studentId !== undefined) params = params.set('studentId', filters.studentId);
  if (filters.teacherId !== undefined) params = params.set('teacherId', filters.teacherId);
  if (filters.subjectId !== undefined) params = params.set('subjectId', filters.subjectId);
  return params;
}
