import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Programme } from '../../../models/programme.model';

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  private readonly programmes: Programme[] = [
    {
      id: '1',
      titre: 'Délégation générale à la Protection sociale et à la Solidarité nationale (DGPSN)',
      category: 'Social',
      description:
        'Instance centrale de coordination des politiques sociales et gestion du Registre National Unique (RNU).',
      image:
        'https://devcommunautaire.gouv.sn/sites/default/files/team/Plan%20de%20travail%2041.png',
    },
    {
      id: '2',
      titre: 'Commissariat à la Sécurité alimentaire (CSA)',
      category: 'Rural & Services',
      description:
        'Lutter contre l’insécurité alimentaire et renforcer la résilience des populations face aux chocs.',
      image: 'csa.jpg',
    },
    {
      id: '3',
      titre: 'Couverture Sanitaire Universelle (CSU)',
      category: 'Santé',
      description:
        'Garantir l’accès aux soins via des mutuelles de santé et une prise en charge subventionnée.',
      image: 'csu.jpeg',
    },
    {
      id: '4',
      titre: 'Programme National de Bourses de Sécurité Familiale (PNBSF)',
      category: 'Social',
      description:
        'Allocation trimestrielle de 35 000 FCFA pour les ménages vulnérables, conditionnée à la santé et l’éducation.',
      image: 'pnbsf.jpg',
    },
    {
      id: '5',
      titre: 'Projet d’Appui à la Protection Sociale Adaptative (PAPSA)',
      category: 'Social',
      description:
        'Transferts productifs et accompagnement pour l’autonomisation économique, notamment des femmes.',
      image: 'https://www.papsa.sn/images/logo-papsa.png',
    },
  ];

  getPrograms(): Observable<Programme[]> {
    return of(this.programmes);
  }

  getProgramById(id: string): Observable<Programme | undefined> {
    return of(this.programmes.find((p) => p.id === id));
  }

  getProgramsByCategory(category: string): Observable<Programme[]> {
    return of(this.programmes.filter((p) => p.category === category));
  }

  get3Programs(): Observable<Programme[]> {
    return of(this.programmes.slice(0, 3));
  }
}
