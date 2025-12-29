import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Region, RegionData } from '../models/region.model';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private readonly regions: Region[] = [
    {
      name: 'Dakar',
      pos: [14.7167, -17.4677],
      count: 324,
      color: '#22c55e',
      beneficiaries: '45,892',
    },
    {
      name: 'Thiès',
      pos: [14.791, -16.9359],
      count: 198,
      color: '#eab308',
      beneficiaries: '28,341',
    },
    {
      name: 'Saint-Louis',
      pos: [16.0179, -16.4896],
      count: 156,
      color: '#3b82f6',
      beneficiaries: '21,567',
    },
    {
      name: 'Kaolack',
      pos: [14.1442, -16.0833],
      count: 142,
      color: '#a855f7',
      beneficiaries: '19,234',
    },
    {
      name: 'Ziguinchor',
      pos: [12.5833, -16.2719],
      count: 89,
      color: '#ef4444',
      beneficiaries: '12,876',
    },
  ];

  private regionsData: RegionData[] = [
    {
      rank: 1,
      name: 'Dakar',
      subtitle: 'Région capitale',
      actions: 324,
      beneficiaries: '45,892',
      programs: 18,
      progress: 92,
      progressChange: '+12%',
      progressColor: 'green',
      icon: 'trophy',
    },
    {
      rank: 2,
      name: 'Thiès',
      subtitle: 'Région ouest',
      actions: 198,
      beneficiaries: '28,341',
      programs: 15,
      progress: 78,
      progressChange: '+8%',
      progressColor: 'green',
    },
    {
      rank: 3,
      name: 'Saint-Louis',
      subtitle: 'Région nord',
      actions: 156,
      beneficiaries: '21,567',
      programs: 12,
      progress: 65,
      progressChange: '+5%',
      progressColor: 'yellow',
    },
    {
      rank: 4,
      name: 'Kaolack',
      subtitle: 'Région centre',
      actions: 142,
      beneficiaries: '19,234',
      programs: 11,
      progress: 58,
      progressChange: '+3%',
      progressColor: 'yellow',
    },
    {
      rank: 5,
      name: 'Ziguinchor',
      subtitle: 'Région sud',
      actions: 89,
      beneficiaries: '12,876',
      programs: 9,
      progress: 45,
      progressChange: '+2%',
      progressColor: 'blue',
    },
  ];

  getRegions(): Observable<Region[]> {
    return of(this.regions);
  }

  getRegionsData(): Observable<RegionData[]> {
    return of(this.regionsData);
  }

  getRegionByName(name: string): Observable<Region | undefined> {
    return of(this.regions.find((r) => r.name === name));
  }
}
