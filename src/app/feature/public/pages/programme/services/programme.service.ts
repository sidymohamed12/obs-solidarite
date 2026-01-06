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
      image: 'https://www.csasenegal.com/img/logo%20footer.png',
    },
    {
      id: '3',
      titre: 'Couverture Sanitaire Universelle (CSU)',
      category: 'Santé',
      description:
        'Garantir l’accès aux soins via des mutuelles de santé et une prise en charge subventionnée.',
      image:
        'https://z-p3-scontent.fdkr5-1.fna.fbcdn.net/v/t39.30808-6/465674145_931112032449458_3902769548327933168_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=4Ri_Qdz7uxUQ7kNvwFMVG2J&_nc_oc=AdmOPwyTCIhWdu0Y-F2crRMwsYKW9L_kBSUiVKMBOcQXviWvRYdO3hapY3YNeHFEtOk&_nc_zt=23&_nc_ht=z-p3-scontent.fdkr5-1.fna&_nc_gid=ksgYridf_YYbLkdEQx7fsQ&oh=00_AfoJiNnAadpSxz6kVt737W8c2BuBlkQlmzq9ftPCmmLS2g&oe=6962EBE2',
    },
    {
      id: '4',
      titre: 'Programme National de Bourses de Sécurité Familiale (PNBSF)',
      category: 'Social',
      description:
        'Allocation trimestrielle de 35 000 FCFA pour les ménages vulnérables, conditionnée à la santé et l’éducation.',
      image:
        'https://z-p3-scontent.fdkr7-1.fna.fbcdn.net/v/t39.30808-6/292376713_416977727117281_2502780151187679972_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=w1yAcmK3ZykQ7kNvwHSWiEI&_nc_oc=AdmiXzJgva_PrpTtWZ1C0fgRdVTw8fGkK9U3jT9rk9YWsk7jhxPAit2M1qqkL--66AA&_nc_zt=23&_nc_ht=z-p3-scontent.fdkr7-1.fna&_nc_gid=71zYcUKxN1eb6qsr3GM8QA&oh=00_AfqQT0IzFKeTAfHw4PoNAih_Z8x0e6hdSeO5ff2b1HQsPg&oe=6962DB65',
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
