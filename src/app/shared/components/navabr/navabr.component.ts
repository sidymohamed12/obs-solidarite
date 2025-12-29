import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navabr',
  imports: [RouterLink, CommonModule],
  templateUrl: './navabr.component.html',
  styleUrl: './navabr.component.css',
})
export class NavabrComponent {
  navLinks = [
    { label: 'Accueil', path: '/accueil' },
    { label: 'Programmes', path: '/programme' },
    { label: 'Carte Interactive', path: '/carte' },
    { label: 'Actualités', path: '/actualites' },
  ];
}
