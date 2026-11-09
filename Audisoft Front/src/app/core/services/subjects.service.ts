import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Subject,
  SubjectQuery,
  SubjectsPagedResult,
  SubjectsSummary,
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../models/subject.models';

@Injectable({ providedIn: 'root' })
export class SubjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subjects`;

  list(query: SubjectQuery): Observable<SubjectsPagedResult> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.teacherId !== undefined) params = params.set('teacherId', query.teacherId);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDir) params = params.set('sortDir', query.sortDir);
    return this.http.get<SubjectsPagedResult>(this.baseUrl, { params });
  }

  /** Indicadores calculados por la API en una sola petición. */
  summary(): Observable<SubjectsSummary> {
    return this.http.get<SubjectsSummary>(`${this.baseUrl}/summary`);
  }

  get(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSubjectDto): Observable<Subject> {
    return this.http.post<Subject>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateSubjectDto): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}/${id}`, dto);
  }

  /** Borrado lógico: la API también elimina las notas registradas en la asignatura. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
