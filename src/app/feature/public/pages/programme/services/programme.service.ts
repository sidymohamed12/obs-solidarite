import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../../core/config/api.config';
import { Programme } from '../../../models/programme.model';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  private readonly http = inject(HttpClient);

  getPrograms(): Observable<Programme[]> {
    return this.http
      .get<Programme[]>(API_ENDPOINTS.programmes.base)
      .pipe(map((programmes) => programmes.filter((programme) => programme.active)));
  }

  getProgramById(id: number | string): Observable<Programme | undefined> {
    return this.getPrograms().pipe(
      map((programmes) => programmes.find((programme) => programme.id === Number(id))),
    );
  }

  getProgramsByCategory(category: string): Observable<Programme[]> {
    return this.getPrograms().pipe(
      map((programmes) => programmes.filter((programme) => programme.category === category)),
    );
  }

  get3Programs(): Observable<Programme[]> {
    return this.getPrograms().pipe(map((programmes) => programmes.slice(0, 3)));
  }
}
