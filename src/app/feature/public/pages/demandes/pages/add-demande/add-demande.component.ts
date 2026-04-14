import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DemandeFormComponent } from '../../components/demande-form/demande-form.component';
import { DemandePayload, DemandeProgrammeOption } from '../../models/demande.model';
import { DemandesApiService } from '../../services/demandes-api.service';
import { ProgrammeService } from '../../../programme/services/programme.service';

@Component({
  selector: 'app-add-demande',
  standalone: true,
  imports: [CommonModule, DemandeFormComponent],
  templateUrl: './add-demande.component.html',
  styleUrl: './add-demande.component.css',
})
export class AddDemandeComponent implements OnInit {
  private readonly demandesApi = inject(DemandesApiService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly router = inject(Router);

  protected programmes: DemandeProgrammeOption[] = [];
  protected loading = false;
  protected submitting = false;
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadProgrammes();
  }

  protected submit(payload: DemandePayload): void {
    this.submitting = true;
    this.errorMessage = null;

    this.demandesApi
      .createDemande(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (demande) => {
          this.router.navigate(['/public/demandes', demande.id], {
            queryParams: { message: 'Demande créée avec succès.' },
          });
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadProgrammes(): void {
    this.loading = true;
    this.programmeService
      .getPrograms()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes
            .map((programme) => ({
              id: Number(programme.id),
              label: programme.titre,
            }))
            .filter((programme) => Number.isFinite(programme.id));
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
