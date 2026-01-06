import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Programme } from '../../models/programme.model';
import { partners } from './constants/partners.constants';
import { ProgrammeService } from '../programme/services/programme.service';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent implements OnInit {
  partners = partners;
  programmes: Programme[] = [];
  isProgramsLoading: boolean = false;
  private readonly programmeService: ProgrammeService = inject(ProgrammeService);

  ngOnInit(): void {
    this.loadProgrammes();
  }

  loadProgrammes(): void {
    this.isProgramsLoading = true;
    this.programmeService
      .get3Programs()
      .pipe(finalize(() => (this.isProgramsLoading = false)))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes;
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  extractAcronym(titre: string): string | null {
    const match = titre.match(/\(([^)]+)\)$/);
    return match ? match[1] : null;
  }

  getGradientClass(index: number): string {
    const gradients = [
      'from-primary via-primary/40',
      'from-yellow-600 via-yellow-600/40',
      'from-red-900 via-red-900/40',
    ];

    return gradients[index % gradients.length];
  }
}
