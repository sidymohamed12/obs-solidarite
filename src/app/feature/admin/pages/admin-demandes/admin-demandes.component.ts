import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DemandeResponse, getDemandeStatusBadge, getDemandeStatusLabel } from '../../../public/pages/demandes/models/demande.model';
import { DemandesApiService } from '../../../public/pages/demandes/services/demandes-api.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-demandes',
  imports: [CommonModule],
  templateUrl: './admin-demandes.component.html',
  styleUrl: './admin-demandes.component.css',
})
export class AdminDemandesComponent implements OnInit {
  private readonly demandesApi = inject(DemandesApiService);
  private readonly auth = inject(AuthService);

  protected loading = false;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected demandes: DemandeResponse[] = [];

  ngOnInit(): void {
    this.loadDemandes();
  }

  protected getStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadge(status: string): string {
    return getDemandeStatusBadge(status);
  }

  protected validateDemande(demande: DemandeResponse): void {
    this.errorMessage = null;
    this.successMessage = null;

    this.demandesApi.updateDemandeStatut(demande.id, 'VALIDEE', {
      id: this.auth.user()?.id ?? 0,
      nom: `${this.auth.user()?.prenom ?? ''} ${this.auth.user()?.nom ?? ''}`.trim() || 'Administrateur',
    }).subscribe({
      next: () => {
        this.successMessage = `Le dossier ${demande.numero} a été validé.`;
        this.loadDemandes();
      },
      error: () => {
        this.errorMessage = 'Impossible de valider ce dossier.';
      },
    });
  }

  private loadDemandes(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.demandesApi.listDemandes().subscribe({
      next: (demandes) => {
        this.demandes = demandes;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les demandes.';
        this.loading = false;
      },
    });
  }
}
