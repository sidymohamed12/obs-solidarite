import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../../layout/public-layout/public-layout.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { ProgrammeComponent } from './pages/programme/pages/list-programme/programme.component';
import { CarteActionComponent } from './pages/carte-action/carte-action.component';
import { RealisationActualiteComponent } from './pages/realisation-actualite/pages/list-article/realisation-actualite.component';
import { AddDemandeComponent } from './pages/demandes/pages/add-demande/add-demande.component';
import { ListDemandeComponent } from './pages/demandes/pages/list-demande/list-demande.component';
import { DetailDemandeComponent } from './pages/demandes/pages/detail-demande/detail-demande.component';
import { UpdateDemandeComponent } from './pages/demandes/pages/update-demande/update-demande.component';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil', component: AccueilComponent },
      { path: 'programme', component: ProgrammeComponent },
      // { path: 'programme/:id', component: ProgrammeComponent, title: 'Programmes' },
      { path: 'carte-action', component: CarteActionComponent },
      { path: 'demandes', component: ListDemandeComponent },
      { path: 'demandes/nouveau', component: AddDemandeComponent },
      { path: 'demandes/:id/modifier', component: UpdateDemandeComponent },
      { path: 'demandes/:id', component: DetailDemandeComponent },
      { path: 'add-demande', redirectTo: 'demandes/nouveau', pathMatch: 'full' },
      {
        path: 'realisations-actualites',
        component: RealisationActualiteComponent,
        title: 'Realisations et Actualites',
      },
    ],
  },
];
