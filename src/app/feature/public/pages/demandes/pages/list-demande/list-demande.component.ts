import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  DemandeResponse,
  getDemandeStatusBadge,
  getDemandeStatusLabel,
} from '../../models/demande.model';
import { DemandesApiService } from '../../services/demandes-api.service';

@Component({
  selector: 'app-list-demande',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './list-demande.component.html',
  styleUrl: './list-demande.component.css',
})
export class ListDemandeComponent implements OnInit {
  private readonly demandesApi = inject(DemandesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected searchId = '';
  protected loading = false;
  protected deletingId: number | null = null;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected demandes: DemandeResponse[] = [];

  ngOnInit(): void {
    this.successMessage = this.route.snapshot.queryParamMap.get('message');
    this.loadDemandes();
  }

  protected get filteredDemandes(): DemandeResponse[] {
    const value = this.searchId.trim().toLowerCase();

    if (!value) {
      return this.demandes;
    }

    return this.demandes.filter((demande) => demande.numero.toLowerCase().includes(value));
  }

  protected getStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadgeClass(status: string): string {
    return getDemandeStatusBadge(status);
  }

  protected openDemande(): void {
    const match = this.filteredDemandes[0];

    if (!match) {
      this.errorMessage = 'Aucune demande ne correspond à ce numéro.';
      return;
    }

    this.router.navigate(['/public/demandes', match.id]);
  }

  protected deleteDemande(demande: DemandeResponse): void {
    if (!window.confirm(`Supprimer la demande ${demande.numero} ?`)) {
      return;
    }

    this.deletingId = demande.id;
    this.errorMessage = null;
    this.successMessage = null;

    this.demandesApi
      .deleteDemande(demande.id)
      .pipe(finalize(() => (this.deletingId = null)))
      .subscribe({
        next: () => {
          this.demandes = this.demandes.filter((item) => item.id !== demande.id);
          this.successMessage = 'Demande supprimée avec succès.';
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadDemandes(): void {
    this.loading = true;
    this.errorMessage = null;

    this.demandesApi
      .listDemandes()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (demandes) => {
          this.demandes = demandes;
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Impossible de charger les demandes.';
    }

    return 'Impossible de charger les demandes.';
  }
}
