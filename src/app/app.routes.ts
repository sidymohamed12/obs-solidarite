import { Routes } from '@angular/router';
import { AccueilComponent } from './feature/public/pages/accueil/accueil.component';
import { ProgrammeComponent } from './feature/public/pages/programme/programme.component';
import { CarteActionComponent } from './feature/public/pages/carte-action/carte-action.component';
import { RealisationActualiteComponent } from './feature/public/pages/realisation-actualite/realisation-actualite.component';

export const routes: Routes = [
  {
    path: '',
    component: AccueilComponent,
  },
  {
    path: 'accueil',
    component: AccueilComponent,
  },
  {
    path: 'programme',
    component: ProgrammeComponent,
  },
  {
    path: 'carte-action',
    component: CarteActionComponent,
  },
  {
    path: 'realisations-actualites',
    component: RealisationActualiteComponent,
  },
];
