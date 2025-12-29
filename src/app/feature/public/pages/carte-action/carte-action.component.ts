import { Component } from '@angular/core';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-carte-action',
  imports: [MapComponent],
  templateUrl: './carte-action.component.html',
  styleUrl: './carte-action.component.css',
})
export class CarteActionComponent {
  stats = {
    livesImpacted: '156K',
    regionsCovered: 14,
  };

  scrollToMap(): void {
    const mapElement = document.getElementById('map-senegal');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
