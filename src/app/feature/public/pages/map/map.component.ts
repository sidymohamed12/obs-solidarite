import { Component } from '@angular/core';
import { FilterOptions } from '../../models/programme.model';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  imports: [LeafletMapComponent, CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent {
  viewMode: 'map' | 'list' = 'map';

  onFilterChange(filters: FilterOptions): void {
    console.log('Filters applied:', filters);
    // Implement filter logic here
  }

  switchView(mode: 'map' | 'list'): void {
    this.viewMode = mode;
  }

  programTypes = [
    { id: 'bourses', label: 'Bourses de solidarité', checked: true },
    { id: 'alimentaire', label: 'Aide alimentaire', checked: true },
    { id: 'sante', label: 'Santé communautaire', checked: false },
    { id: 'logement', label: 'Logement social', checked: false },
    { id: 'formation', label: 'Formation pro.', checked: false },
  ];

  regions = ['Toutes les régions', 'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack'];

  selectedRegion = this.regions[0];

  applyFilters(): void {
    const selectedPrograms = this.programTypes.filter((p) => p.checked).map((p) => p.id);

    // this.filterChange.emit({
    //   programs: selectedPrograms,
    //   region: this.selectedRegion,
    // });
  }

  resetFilters(): void {
    this.programTypes.forEach((p) => (p.checked = false));
    this.selectedRegion = this.regions[0];
    this.applyFilters();
  }
}
