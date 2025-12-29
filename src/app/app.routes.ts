import { Routes } from '@angular/router';
import { AccueilComponent } from './feature/public/pages/accueil/accueil.component';

export const routes: Routes = [
  {
    path: '',
    component: AccueilComponent,
  },
  {
    path: 'accueil',
    component: AccueilComponent,
  },
];
