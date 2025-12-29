import { Routes } from '@angular/router';
import { AccueilComponent } from './feature/public/pages/accueil/accueil.component';
import { ProgrammeComponent } from './feature/public/pages/programme/programme.component';

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
];
