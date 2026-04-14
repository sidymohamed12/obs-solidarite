import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOptions } from '../../../../models/programme.model';

@Component({
  selector: 'app-filter-sidebar',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.css',
})
export class FilterSidebarComponent {
  @Output() filterChange = new EventEmitter<FilterOptions>();
}
