import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { DemandeFormComponent } from '../../components/demande-form/demande-form.component';
import {
  DemandeFormValue,
  DemandePayload,
  DemandePieceJointe,
  DemandeProgrammeOption,
  toDemandeFormValue,
} from '../../models/demande.model';
import { DemandesApiService } from '../../services/demandes-api.service';
import { ProgrammeService } from '../../../programme/services/programme.service';

@Component({
  selector: 'app-update-demande',
  standalone: true,
  imports: [CommonModule, DemandeFormComponent, RouterLink],
  templateUrl: './update-demande.component.html',
  styleUrl: './update-demande.component.css',
})
export class UpdateDemandeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly demandesApi = inject(DemandesApiService);
  private readonly programmeService = inject(ProgrammeService);

  protected demandeId: number | null = null;
  protected initialValue: DemandeFormValue | null = null;
  protected existingDocuments: DemandePieceJointe[] = [];
  protected programmes: DemandeProgrammeOption[] = [];
  protected loading = false;
  protected submitting = false;
  protected downloadingDocumentId: number | null = null;
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id)) {
      this.errorMessage = 'Identifiant de demande invalide.';
      return;
    }

    this.demandeId = id;
    this.loadProgrammes();
    this.loadDemande(id);
  }

  protected submit(payload: DemandePayload): void {
    if (!this.demandeId) {
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    this.demandesApi
      .updateDemande(this.demandeId, payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (demande) => {
          this.router.navigate(['/public/demandes', demande.id], {
            queryParams: { message: 'Demande mise à jour avec succès.' },
          });
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  protected downloadDocument(pieceJointe: DemandePieceJointe): void {
    if (!this.demandeId) {
      return;
    }

    this.downloadingDocumentId = pieceJointe.id;

    this.demandesApi
      .downloadDocument(this.demandeId, pieceJointe.id)
      .pipe(finalize(() => (this.downloadingDocumentId = null)))
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            this.errorMessage = 'Le document téléchargé est vide.';
            return;
          }

          const objectUrl = URL.createObjectURL(blob);
          const link = globalThis.document.createElement('a');
          link.href = objectUrl;
          link.download = pieceJointe.nomOriginal;
          link.click();
          URL.revokeObjectURL(objectUrl);
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadProgrammes(): void {
    this.programmeService.getPrograms().subscribe({
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

  private loadDemande(id: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.demandesApi
      .getDemande(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (demande) => {
          this.initialValue = toDemandeFormValue(demande);
          this.existingDocuments = demande.piecesJointes;
          this.loadDocuments(id);
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadDocuments(id: number): void {
    this.demandesApi.listDocuments(id).subscribe({
      next: (documents) => {
        this.existingDocuments = documents;
      },
      error: () => {
        // On conserve la liste provenant du détail si l'endpoint documents échoue.
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
