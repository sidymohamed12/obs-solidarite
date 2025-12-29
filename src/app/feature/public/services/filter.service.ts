import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FilterOptions } from '../models/programme.model';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private readonly filtersSubject = new BehaviorSubject<FilterOptions>({
    programs: [],
    region: 'Toutes les régions',
  });

  filters$: Observable<FilterOptions> = this.filtersSubject.asObservable();

  updateFilters(filters: FilterOptions): void {
    this.filtersSubject.next(filters);
  }

  getCurrentFilters(): FilterOptions {
    return this.filtersSubject.value;
  }

  resetFilters(): void {
    this.filtersSubject.next({
      programs: [],
      region: 'Toutes les régions',
    });
  }
}
