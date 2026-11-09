import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Subject } from '../models/subject.models';
import {
  CreateTeacherDto,
  Teacher,
  TeacherQuery,
  TeachersPagedResult,
  TeachersSummary,
  UpdateTeacherDto,
} from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teachers`;

  list(query: TeacherQuery): Observable<TeachersPagedResult> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.isActive !== undefined) params = params.set('isActive', query.isActive);
    if (query.registeredFrom) params = params.set('registeredFrom', query.registeredFrom);
    if (query.registeredTo) params = params.set('registeredTo', query.registeredTo);
    if (query.hasSubjects !== undefined) params = params.set('hasSubjects', query.hasSubjects);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDir) params = params.set('sortDir', query.sortDir);
    return this.http.get<TeachersPagedResult>(this.baseUrl, { params });
  }

  /** Indicadores calculados por la API en una sola petición. */
  summary(): Observable<TeachersSummary> {
    return this.http.get<TeachersSummary>(`${this.baseUrl}/summary`);
  }

  get(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/${id}`);
  }

  subjects(id: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.baseUrl}/${id}/subjects`);
  }

  create(dto: CreateTeacherDto): Observable<Teacher> {
    return this.http.post<Teacher>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateTeacherDto): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
