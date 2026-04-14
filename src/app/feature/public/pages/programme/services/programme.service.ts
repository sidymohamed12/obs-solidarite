import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../../core/config/api.config';
import { Programme, ProgrammeCategory } from '../../../models/programme.model';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  private readonly http = inject(HttpClient);

  getAllPrograms(): Observable<Programme[]> {
    return this.http.get<Programme[]>(API_ENDPOINTS.programmes.base);
  }

  getPrograms(): Observable<Programme[]> {
    return this.getAllPrograms().pipe(
      map((programmes) => programmes.filter((programme) => programme.active)),
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<ProgrammeCategory[]>(API_ENDPOINTS.categories.base).pipe(
      map((categories) => categories.filter((category) => category.active).map((category) => category.nom)),
      map((categories) => [...new Set(categories)]),
    );
  }

  getProgramById(id: number | string): Observable<Programme | undefined> {
    return this.getPrograms().pipe(
      map((programmes) => programmes.find((programme) => programme.id === Number(id))),
    );
  }

  get3Programs(): Observable<Programme[]> {
    return this.getPrograms().pipe(map((programmes) => programmes.slice(0, 3)));
  }
}
