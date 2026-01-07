import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navabr',
  imports: [RouterModule, CommonModule],
  templateUrl: './navabr.component.html',
  styleUrl: './navabr.component.css',
})
export class NavabrComponent {
  navLinks = [
    { label: 'Accueil', path: '/public/accueil' },
    { label: 'Programmes', path: '/public/programme' },
    { label: 'Carte Action', path: '/public/carte-action' },
    { label: 'Réalisations', path: '/public/realisations-actualites' },
  ];
}
