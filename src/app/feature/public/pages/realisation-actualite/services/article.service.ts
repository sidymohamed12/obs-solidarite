import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../../../../core/config/api.config';
import { Article, PostDto, PostType, mapPostToArticle } from '../../../models/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly http = inject(HttpClient);

  getArticles(): Observable<Article[]> {
    return this.listPosts().pipe(map((posts) => posts.map((post, index) => mapPostToArticle(post, index))));
  }

  getArticleById(id: number): Observable<Article | undefined> {
    return this.getPost(id).pipe(map((post) => (post ? mapPostToArticle(post) : undefined)));
  }

  getArticlesByType(type: PostType): Observable<Article[]> {
    return this.listPostsByType(type).pipe(map((posts) => posts.map((post, index) => mapPostToArticle(post, index))));
  }

  listPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(API_ENDPOINTS.posts.base).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  listPostsByType(type: PostType): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(API_ENDPOINTS.posts.byType(type)).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  getPost(id: number): Observable<PostDto> {
    return this.http.get<PostDto>(API_ENDPOINTS.posts.byId(id)).pipe(
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
