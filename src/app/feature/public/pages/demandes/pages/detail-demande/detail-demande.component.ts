import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  DemandePieceJointe,
  DemandeResponse,
  getDemandeStatusBadge,
  getDemandeStatusLabel,
} from '../../models/demande.model';
import { DemandesApiService } from '../../services/demandes-api.service';

@Component({
  selector: 'app-detail-demande',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-demande.component.html',
  styleUrl: './detail-demande.component.css',
})
export class DetailDemandeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly demandesApi = inject(DemandesApiService);

  protected demande: DemandeResponse | null = null;
  protected documents: DemandePieceJointe[] = [];
  protected loading = false;
  protected loadingDocuments = false;
  protected deleting = false;
  protected downloadingDocumentId: number | null = null;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.successMessage = this.route.snapshot.queryParamMap.get('message');

    if (!Number.isFinite(id)) {
      this.errorMessage = 'Identifiant de demande invalide.';
      return;
    }

    this.loadDemande(id);
    this.loadDocuments(id);
  }

  protected getStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadge(status: string): string {
    return getDemandeStatusBadge(status);
  }

  protected download(document: DemandePieceJointe): void {
    if (!this.demande) {
      return;
    }

    this.downloadingDocumentId = document.id;

    this.demandesApi
      .downloadDocument(this.demande.id, document.id)
      .pipe(finalize(() => (this.downloadingDocumentId = null)))
      .subscribe({
        next: (response) => {
          this.saveBlob(response, document.nomOriginal);
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  protected deleteDemande(): void {
    if (!this.demande || !window.confirm(`Supprimer la demande ${this.demande.numero} ?`)) {
      return;
    }

    this.deleting = true;
    this.errorMessage = null;

    this.demandesApi
      .deleteDemande(this.demande.id)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/public/demandes'], {
            queryParams: { message: 'Demande supprimée avec succès.' },
          });
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
          this.demande = demande;
          if (this.documents.length === 0) {
            this.documents = demande.piecesJointes;
          }
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadDocuments(id: number): void {
    this.loadingDocuments = true;

    this.demandesApi
      .listDocuments(id)
      .pipe(finalize(() => (this.loadingDocuments = false)))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
        },
        error: () => {
          if (!this.demande) {
            return;
          }

          this.documents = this.demande.piecesJointes;
        },
      });
  }

  private saveBlob(response: HttpResponse<Blob>, fallbackFileName: string): void {
    const blob = response.body;

    if (!blob) {
      this.errorMessage = 'Le document téléchargé est vide.';
      return;
    }

    const header = response.headers.get('content-disposition') ?? '';
    const extractedFileName = header.match(/filename\*?=(?:UTF-8''|\")?([^;\"]+)/i)?.[1];
    const fileName = decodeURIComponent((extractedFileName ?? fallbackFileName).replace(/\"/g, ''));
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(objectUrl);
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Une erreur est survenue.';
    }

    return 'Une erreur est survenue.';
  }
}
