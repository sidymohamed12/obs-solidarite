import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Programme } from '../../../../models/programme.model';
import { ProgrammeService } from '../../services/programme.service';

@Component({
  selector: 'app-detail-programme',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './detail-programme.component.html',
  styleUrl: './detail-programme.component.css',
})
export class DetailProgrammeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly programmeService = inject(ProgrammeService);

  protected programme: Programme | null = null;
  protected loading = false;
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id)) {
      this.errorMessage = 'Identifiant de programme invalide.';
      return;
    }

    this.loadProgramme(id);
  }

  protected getProgrammeFocus(category: string): string {
    switch (category) {
      case 'Social':
        return 'Protection sociale';
      case 'Santé':
        return 'Accès aux soins';
      case 'Rural & Services':
        return 'Services de proximité';
      default:
        return category;
    }
  }

  private loadProgramme(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.programmeService
      .getProgramById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (programme) => {
          if (!programme) {
            this.errorMessage = 'Programme introuvable.';
            return;
          }

          this.programme = programme;
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Une erreur est survenue.';
    }

    return 'Une erreur est survenue.';
  }
}
