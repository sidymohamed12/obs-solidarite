import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../../../core/config/api.config';
import {
  Programme,
  ProgrammeCategory,
  ProgrammeCategoryUpsertPayload,
  ProgrammeUpsertPayload,
} from '../../../public/models/programme.model';

@Injectable({ providedIn: 'root' })
export class AdminProgrammesApiService {
  private readonly http = inject(HttpClient);

  listProgrammes(): Observable<Programme[]> {
    return this.http.get<Programme[]>(API_ENDPOINTS.programmes.base).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  listCategories(): Observable<ProgrammeCategory[]> {
    return this.http.get<ProgrammeCategory[]>(API_ENDPOINTS.categories.base).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  createProgramme(payload: ProgrammeUpsertPayload): Observable<Programme> {
    return this.http.post<Programme>(API_ENDPOINTS.programmes.base, payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  updateProgramme(id: number, payload: ProgrammeUpsertPayload): Observable<Programme> {
    return this.http.patch<Programme>(API_ENDPOINTS.programmes.byId(id), payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.programmes.byId(id)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  createCategory(payload: ProgrammeCategoryUpsertPayload): Observable<ProgrammeCategory> {
    return this.http.post<ProgrammeCategory>(API_ENDPOINTS.categories.base, payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  updateCategory(id: number, payload: ProgrammeCategoryUpsertPayload): Observable<ProgrammeCategory> {
    return this.http.patch<ProgrammeCategory>(API_ENDPOINTS.categories.byId(id), payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.categories.byId(id)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      (error.error && typeof error.error === 'object' && 'message' in error.error
        ? String((error.error as { message?: string }).message ?? '')
        : '') ||
      (typeof error.error === 'string' ? error.error : '') ||
      error.message ||
      'Une erreur est survenue.';

    return throwError(() => ({ ...error, message }));
  }
}
