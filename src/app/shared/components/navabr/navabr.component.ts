import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-navabr',
  imports: [RouterModule, CommonModule],
  templateUrl: './navabr.component.html',
  styleUrl: './navabr.component.css',
})
export class NavabrComponent {
  protected readonly auth = inject(AuthService);

  navLinks = [
    { label: 'Accueil', path: '/public/accueil' },
    { label: 'Programmes', path: '/public/programme' },
    { label: 'Carte Action', path: '/public/carte-action' },
    { label: 'Réalisations', path: '/public/realisations-actualites' },
  ];
}
