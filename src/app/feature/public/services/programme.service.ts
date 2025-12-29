import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Program } from '../models/programme.model';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  private readonly programs: Program[] = [
    {
      id: 'bourses',
      title: 'Bourses de Solidarité Familiale',
      description:
        "Soutien financier direct aux familles en situation de vulnérabilité pour l'éducation des enfants.",
      icon: 'graduation-cap',
      beneficiaries: '42K',
      color: 'green',
      bgColor: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100 text-green-600',
    },
    {
      id: 'alimentaire',
      title: 'Programme Alimentaire National',
      description:
        'Distribution de vivres et coupons alimentaires aux ménages les plus démunis du territoire.',
      icon: 'utensils',
      beneficiaries: '38K',
      color: 'yellow',
      bgColor: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100 text-yellow-600',
    },
    {
      id: 'sante',
      title: 'Santé Communautaire',
      description:
        'Accès gratuit aux soins de santé primaire et consultations médicales pour tous.',
      icon: 'heartbeat',
      beneficiaries: '29K',
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
    },
  ];

  getPrograms(): Observable<Program[]> {
    return of(this.programs);
  }

  getProgramById(id: string): Observable<Program | undefined> {
    return of(this.programs.find((p) => p.id === id));
  }
}
