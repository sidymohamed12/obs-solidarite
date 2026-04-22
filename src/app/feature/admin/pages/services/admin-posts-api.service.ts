import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../../../core/config/api.config';
import { PostDto, PostType, PostUpsertPayload } from '../../../public/models/article.model';

@Injectable({ providedIn: 'root' })
export class AdminPostsApiService {
  private readonly http = inject(HttpClient);

  listPosts(type?: PostType): Observable<PostDto[]> {
    const endpoint = type ? API_ENDPOINTS.posts.byType(type) : API_ENDPOINTS.posts.base;

    return this.http.get<PostDto[]>(endpoint).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  getPost(id: number): Observable<PostDto> {
    return this.http.get<PostDto>(API_ENDPOINTS.posts.byId(id)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  createPost(payload: PostUpsertPayload): Observable<PostDto> {
    return this.http.post<PostDto>(API_ENDPOINTS.posts.base, this.toFormData(payload)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  updatePost(id: number, payload: PostUpsertPayload): Observable<PostDto> {
    return this.http.put<PostDto>(API_ENDPOINTS.posts.byId(id), this.toFormData(payload)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.posts.byId(id)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private toFormData(payload: PostUpsertPayload): FormData {
    const formData = new FormData();

    formData.append('titre', payload.titre.trim());
    formData.append('typePost', payload.typePost);

    if (payload.description?.trim()) {
      formData.append('description', payload.description.trim());
    }

    if (payload.image) {
      formData.append('image', payload.image, payload.image.name);
    }

    return formData;
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
