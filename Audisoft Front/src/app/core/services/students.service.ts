import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateStudentDto,
  Student,
  StudentAverage,
  StudentQuery,
  StudentsPagedResult,
  StudentsSummary,
  UpdateStudentDto,
} from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/students`;

  list(query: StudentQuery): Observable<StudentsPagedResult> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.isActive !== undefined) params = params.set('isActive', query.isActive);
    if (query.enrolledFrom) params = params.set('enrolledFrom', query.enrolledFrom);
    if (query.enrolledTo) params = params.set('enrolledTo', query.enrolledTo);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDir) params = params.set('sortDir', query.sortDir);
    return this.http.get<StudentsPagedResult>(this.baseUrl, { params });
  }

  /** Indicadores calculados por la API en una sola petición. */
  summary(): Observable<StudentsSummary> {
    return this.http.get<StudentsSummary>(`${this.baseUrl}/summary`);
  }

  get(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`);
  }

  average(id: number): Observable<StudentAverage> {
    return this.http.get<StudentAverage>(`${this.baseUrl}/${id}/average`);
  }

  create(dto: CreateStudentDto): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, dto);
  }

  update(id: number, dto: UpdateStudentDto): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
