import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Programme } from '../../../models/programme.model';

export const PROGRAMMES_MOCK: Programme[] = [
  {
    id: 1,
    titre: 'Programme d’Appui aux Familles Vulnérables (PAFV)',
    category: 'Social',
    description:
      'Accompagnement des ménages vulnérables avec transfert social, suivi communautaire et orientation vers les services publics.',
    image: 'realisations/collab-ligue-islamique.jpg',
    active: true,
  },
  {
    id: 2,
    titre: 'Initiative Santé Mère-Enfant',
    category: 'Santé',
    description:
      'Soutien à la santé maternelle et infantile avec campagnes de prévention, consultation de proximité et appui nutritionnel.',
    image: 'realisations/kdo-bb.jpg',
    active: true,
  },
  {
    id: 3,
    titre: 'Autonomisation Économique des Femmes',
    category: 'Emploi',
    description:
      'Renforcement de capacités, formation pratique et financement d’activités génératrices de revenus.',
    image: 'realisations/collab-styliste.jpg',
    active: true,
  },
  {
    id: 4,
    titre: 'Programme Inclusion Numérique Locale',
    category: 'Éducation',
    description:
      'Accompagnement numérique des jeunes et femmes en milieu urbain et rural.',
    image: 'realisations/tournoi-foot.jpg',
    active: true,
  },
  {
    id: 5,
    titre: 'Plan Rural Eau & Services',
    category: 'Rural & Services',
    description:
      'Amélioration de l’accès aux services de base: eau, état civil, et information sociale.',
    image: 'realisations/appel-sey-lima.jpg',
    active: true,
  },
  {
    id: 6,
    titre: 'Programme Jeunesse et Citoyenneté',
    category: 'Jeunesse',
    description: 'Engagement citoyen, formation civique et mobilisation communautaire.',
    image: 'realisations/collab-coumba.jpg',
    active: true,
  },
  {
    id: 7,
    titre: 'Soutien Nutrition et Résilience',
    category: 'Santé',
    description: 'Prise en charge nutritionnelle et sensibilisation pour les zones à risque.',
    image: 'realisations/kdo-bb.jpg',
    active: false,
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProgrammeService {
  getAllPrograms(): Observable<Programme[]> {
    return of(PROGRAMMES_MOCK.map((programme) => ({ ...programme })));
  }

  getPrograms(): Observable<Programme[]> {
    return this.getAllPrograms().pipe(
      map((programmes) => programmes.filter((programme) => programme.active)),
    );
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
