import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../../layout/public-layout/public-layout.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { ProgrammeComponent } from './pages/programme/pages/list-programme/programme.component';
import { CarteActionComponent } from './pages/carte-action/carte-action.component';
import { RealisationActualiteComponent } from './pages/realisation-actualite/pages/list-article/realisation-actualite.component';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil', component: AccueilComponent, title: 'Accueil' },
      { path: 'programme', component: ProgrammeComponent, title: 'Programmes' },
      // { path: 'programme/:id', component: ProgrammeComponent, title: 'Programmes' },
      { path: 'carte-action', component: CarteActionComponent, title: 'Carte Action' },
      {
        path: 'realisations-actualites',
        component: RealisationActualiteComponent,
        title: 'Realisations et Actualites',
      },
    ],
  },
];
