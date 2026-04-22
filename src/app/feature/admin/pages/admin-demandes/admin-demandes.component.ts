import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemandePieceJointe, DemandeResponse, getDemandeStatusBadge, getDemandeStatusLabel } from '../../../public/pages/demandes/models/demande.model';
import { UserDto } from '../../../../core/auth/models/auth.models';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { DemandesApiService } from '../services/demandes-api.service';

type AdminStatusFilter = 'ALL' | 'EN_ATTENTE' | 'EN_COURS' | 'VERIFIEE' | 'REJETEE' | 'VALIDEE';

@Component({
  selector: 'app-admin-demandes',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-demandes.component.html',
  styleUrl: './admin-demandes.component.css',
})
export class AdminDemandesComponent implements OnInit {
  private readonly demandesApi: DemandesApiService = inject(DemandesApiService);
  private readonly auth = inject(AuthService);

  @ViewChild('detailSection') private detailSection?: ElementRef<HTMLElement>;

  protected loading = false;
  protected detailLoading = false;
  protected downloadingDocumentId: number | null = null;
  protected actionLoadingId: number | null = null;
  protected actionLoadingType: 'validate' | 'reject' | null = null;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected demandes: DemandeResponse[] = [];
  protected agents: UserDto[] = [];
  protected selectedDemandeDetail: DemandeResponse | null = null;
  protected selectedDocuments: DemandePieceJointe[] = [];
  protected currentPage = 1;
  protected searchTerm = '';
  protected selectedStatus: AdminStatusFilter = 'ALL';

  private readonly pageSize = 5;

  ngOnInit(): void {
    this.loadDemandes();
    this.loadAgents();
  }

  protected getStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadge(status: string): string {
    return getDemandeStatusBadge(status);
  }

  protected get paginatedDemandes(): DemandeResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredDemandes.slice(startIndex, startIndex + this.pageSize);
  }

  protected get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDemandes.length / this.pageSize));
  }

  protected get paginationLabel(): string {
    if (this.filteredDemandes.length === 0) {
      return 'Aucun dossier';
    }

    const startIndex = (this.currentPage - 1) * this.pageSize + 1;
    const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredDemandes.length);
    return `${startIndex}-${endIndex} sur ${this.filteredDemandes.length}`;
  }

  protected get filteredDemandes(): DemandeResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.demandes.filter((demande) => {
      const matchesTerm =
        term.length === 0 ||
        demande.numero.toLowerCase().includes(term) ||
        `${demande.prenom ?? ''} ${demande.nom ?? ''}`.toLowerCase().includes(term) ||
        (demande.telephone ?? '').toLowerCase().includes(term) ||
        (demande.region ?? '').toLowerCase().includes(term);

      const matchesStatus = this.selectedStatus === 'ALL' || demande.statut === this.selectedStatus;

      return matchesTerm && matchesStatus;
    });
  }

  protected get demandeKpis(): Array<{ label: string; value: number; status: AdminStatusFilter; accent: string; hint: string }> {
    return [
      { label: 'Demandes', value: this.demandes.length, status: 'ALL', accent: 'text-slate-950', hint: 'Vue globale' },
      { label: 'En attente', value: this.countByStatus('EN_ATTENTE'), status: 'EN_ATTENTE', accent: 'text-slate-900', hint: 'À traiter' },
      { label: 'En cours', value: this.countByStatus('EN_COURS'), status: 'EN_COURS', accent: 'text-amber-700', hint: 'Instruction active' },
      { label: 'Vérifiées', value: this.countByStatus('VERIFIEE'), status: 'VERIFIEE', accent: 'text-cyan-700', hint: 'Prêtes pour validation' },
      { label: 'Rejetées', value: this.countByStatus('REJETEE'), status: 'REJETEE', accent: 'text-rose-700', hint: 'Décision négative' },
      { label: 'Validées', value: this.countByStatus('VALIDEE'), status: 'VALIDEE', accent: 'text-emerald-700', hint: 'Décision finale' },
    ];
  }

  protected get agentKpis(): Array<{ label: string; value: number; accent: string; hint: string }> {
    return [
      { label: 'Agents', value: this.agents.length, accent: 'text-slate-950', hint: 'Effectif total' },
      { label: 'Actifs', value: this.activeAgentsCount, accent: 'text-emerald-700', hint: 'Disponibles' },
      { label: 'Inactifs', value: this.inactiveAgentsCount, accent: 'text-slate-500', hint: 'Hors ligne' },
    ];
  }

  protected get activeAgentsCount(): number {
    return this.agents.filter((agent) => agent.active !== false).length;
  }

  protected get inactiveAgentsCount(): number {
    return this.agents.filter((agent) => agent.active === false).length;
  }

  protected canValidateDemande(demande: DemandeResponse): boolean {
    return demande.statut === 'VERIFIEE';
  }

  protected canRejectDemande(demande: DemandeResponse): boolean {
    return demande.statut === 'VERIFIEE';
  }

  protected shouldShowDecisionActions(demande: DemandeResponse): boolean {
    return demande.statut === 'VERIFIEE';
  }

  protected getDecisionStatusLabel(demande: DemandeResponse): string {
    if (demande.statut === 'VALIDEE') {
      return 'Validée';
    }

    if (demande.statut === 'REJETEE') {
      return 'Rejetée';
    }

    return 'En attente de vérification';
  }

  protected getDecisionStatusClass(demande: DemandeResponse): string {
    if (demande.statut === 'VALIDEE') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (demande.statut === 'REJETEE') {
      return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-400';
  }

  protected getValidateButtonLabel(demande: DemandeResponse): string {
    return demande.statut === 'VERIFIEE' ? 'Valider' : 'Validée';
  }

  protected getRejectButtonLabel(demande: DemandeResponse): string {
    return demande.statut === 'VERIFIEE' ? 'Rejeter' : 'Rejetée';
  }

  protected isProcessing(demande: DemandeResponse, action: 'validate' | 'reject'): boolean {
    return this.actionLoadingId === demande.id && this.actionLoadingType === action;
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  protected applyStatusFilter(status: AdminStatusFilter): void {
    this.selectedStatus = status;
    this.currentPage = 1;
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  protected resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.currentPage = 1;
  }

  protected onFiltersChange(): void {
    this.currentPage = 1;
  }

  protected showDetails(demande: DemandeResponse): void {
    if (this.selectedDemandeDetail?.id === demande.id) {
      this.selectedDemandeDetail = null;
      this.selectedDocuments = [];
      return;
    }

    this.detailLoading = true;
    this.errorMessage = null;

    this.demandesApi.getAdminDemande(demande.id).subscribe({
      next: (detail: DemandeResponse) => {
        this.selectedDemandeDetail = detail;
        this.selectedDocuments = detail.piecesJointes ?? [];
        this.loadDetailDocuments(detail.id);
        this.detailLoading = false;
        this.scrollToDetailSection();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de charger le détail de cette demande.');
        this.detailLoading = false;
      },
    });
  }

  protected isDetailOpen(demande: DemandeResponse): boolean {
    return this.selectedDemandeDetail?.id === demande.id;
  }

  protected downloadDocument(document: DemandePieceJointe): void {
    if (!this.selectedDemandeDetail) {
      return;
    }

    this.downloadingDocumentId = document.id;
    this.errorMessage = null;

    this.demandesApi.downloadAdminDocument(this.selectedDemandeDetail.id, document.id).subscribe({
      next: (response: HttpResponse<Blob>) => {
        this.saveBlob(response, document.nomOriginal);
        this.downloadingDocumentId = null;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de télécharger ce document.');
        this.downloadingDocumentId = null;
      },
    });
  }

  protected openDocument(document: DemandePieceJointe): void {
    if (!this.selectedDemandeDetail) {
      return;
    }

    this.downloadingDocumentId = document.id;
    this.errorMessage = null;

    this.demandesApi.downloadAdminDocument(this.selectedDemandeDetail.id, document.id).subscribe({
      next: (response: HttpResponse<Blob>) => {
        this.openBlob(response, document.nomOriginal);
        this.downloadingDocumentId = null;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible d\'ouvrir ce document.');
        this.downloadingDocumentId = null;
      },
    });
  }

  protected getFileType(document: DemandePieceJointe): string {
    const extension = document.nomOriginal.split('.').pop()?.toLowerCase();

    if (!extension) {
      return 'Document';
    }

    if (extension === 'pdf') {
      return 'PDF';
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'Image';
    }

    return extension.toUpperCase();
  }

  protected getFileIcon(document: DemandePieceJointe): string {
    const extension = document.nomOriginal.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return 'fa-file-pdf text-rose-500';
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension ?? '')) {
      return 'fa-file-image text-sky-500';
    }

    return 'fa-file-lines text-slate-500';
  }

  protected validateDemande(demande: DemandeResponse): void {
    if (!this.canValidateDemande(demande)) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    this.actionLoadingId = demande.id;
    this.actionLoadingType = 'validate';

    this.demandesApi.validateAdminDemande(demande.id).subscribe({
      next: (updatedDemande: DemandeResponse) => {
        this.applyDemandeUpdate(demande.id, updatedDemande, 'VALIDEE');
        this.successMessage = `Le dossier ${demande.numero} a été validé par l'administration.`;
        this.actionLoadingId = null;
        this.actionLoadingType = null;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de valider ce dossier côté administration.');
        this.actionLoadingId = null;
        this.actionLoadingType = null;
      },
    });
  }

  protected rejectDemande(demande: DemandeResponse): void {
    if (!this.canRejectDemande(demande)) {
      return;
    }

    const motifRejet = globalThis.prompt(
      `Motif du rejet pour ${demande.numero}`,
      demande.motifRejet?.trim() || '',
    );

    if (motifRejet === null) {
      return;
    }

    const trimmedReason = motifRejet.trim();
    if (!trimmedReason) {
      this.errorMessage = 'Le motif du rejet est obligatoire.';
      this.successMessage = null;
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.actionLoadingId = demande.id;
    this.actionLoadingType = 'reject';

    this.demandesApi.rejectAdminDemande(demande.id, { motif: trimmedReason }).subscribe({
      next: (updatedDemande: DemandeResponse) => {
        this.applyDemandeUpdate(demande.id, updatedDemande, 'REJETEE', trimmedReason);
        this.successMessage = `Le dossier ${demande.numero} a été rejeté par l'administration.`;
        this.actionLoadingId = null;
        this.actionLoadingType = null;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de rejeter ce dossier côté administration.');
        this.actionLoadingId = null;
        this.actionLoadingType = null;
      },
    });
  }

  private loadDemandes(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.demandesApi.listAdminDemandes().subscribe({
      next: (demandes: DemandeResponse[]) => {
        this.demandes = demandes;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de charger les demandes.');
        this.loading = false;
      },
    });
  }

  private loadAgents(): void {
    this.auth.listAdminAgents().subscribe({
      next: (agents: UserDto[]) => {
        this.agents = agents;
      },
      error: () => {
        this.agents = [];
      },
    });
  }

  private loadDetailDocuments(id: number): void {
    this.demandesApi.listDocuments(id).subscribe({
      next: (documents: DemandePieceJointe[]) => {
        this.selectedDocuments = documents;
      },
      error: () => {
        if (this.selectedDemandeDetail) {
          this.selectedDocuments = this.selectedDemandeDetail.piecesJointes ?? [];
        }
      },
    });
  }

  private saveBlob(response: HttpResponse<Blob>, fallbackFileName: string): void {
    const blob = response.body;

    if (!blob) {
      this.errorMessage = 'Le document téléchargé est vide.';
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fallbackFileName;
    link.click();

    URL.revokeObjectURL(objectUrl);
  }

  private openBlob(response: HttpResponse<Blob>, fallbackFileName: string): void {
    const blob = response.body;

    if (!blob) {
      this.errorMessage = 'Le document à ouvrir est vide.';
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.ariaLabel = `Ouvrir ${fallbackFileName}`;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  private scrollToDetailSection(): void {
    window.setTimeout(() => {
      this.detailSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  private countByStatus(status: Exclude<AdminStatusFilter, 'ALL'>): number {
    return this.demandes.filter((demande) => demande.statut === status).length;
  }

  private applyDemandeUpdate(
    id: number,
    updatedDemande: DemandeResponse,
    fallbackStatus: 'VALIDEE' | 'REJETEE',
    motifRejet?: string,
  ): void {
    const patchedDemande = {
      ...updatedDemande,
      statut: updatedDemande.statut ?? fallbackStatus,
      motifRejet: updatedDemande.motifRejet ?? motifRejet,
    };

    this.demandes = this.demandes.map((item) =>
      item.id === id ? { ...item, ...patchedDemande } : item,
    );

    if (this.selectedDemandeDetail?.id === id) {
      this.selectedDemandeDetail = {
        ...this.selectedDemandeDetail,
        ...patchedDemande,
      };
    }
  }

  private extractError(error: unknown, fallbackMessage: string): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string } | string; message?: string };

      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }

      if (httpError.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        const apiMessage = (httpError.error as { message?: string }).message;
        if (apiMessage?.trim()) {
          return apiMessage;
        }
      }

      if (httpError.message?.trim()) {
        return httpError.message;
      }
    }

    return fallbackMessage;
  }
}
