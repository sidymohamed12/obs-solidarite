import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  DEMANDE_REGIONS,
  DemandePieceJointe,
  DemandeResponse,
  getDemandeStatusLabel,
} from '../../../public/pages/demandes/models/demande.model';
import { DemandesApiService } from '../services/demandes-api.service';
import { ProgrammeService } from '../../../public/pages/programme/pages/services/programme.service';

type AgentStatusFilter = 'ALL' | 'EN_ATTENTE' | 'EN_COURS' | 'VERIFIEE' | 'VALIDEE' | 'REJETEE';
type AgentWorkflowAction = 'PRISE_EN_CHARGE' | 'EN_COURS' | 'VERIFIEE' | 'REJETEE';
const AGENT_WORKFLOW_STORAGE_KEY = 'taxawu_agent_workflow_state';

interface AgentWorkflowChecklist {
  identiteVerifiee: boolean;
  programmeEligible: boolean;
  piecesConformes: boolean;
  analyseFinalisee: boolean;
}

interface AgentWorkflowState {
  assignedAt: string | null;
  instructionStartedAt: string | null;
  lastDecisionAt: string | null;
  lastDecisionLabel: string | null;
  notes: string;
  rejectionReason: string;
  checklist: AgentWorkflowChecklist;
}

@Component({
  selector: 'app-agent-demandes',
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-demandes.component.html',
  styleUrl: './agent-demandes.component.css',
})
export class AgentDemandesComponent implements OnInit {
  private readonly demandesApi = inject(DemandesApiService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly auth = inject(AuthService);

  protected loading = false;
  protected selectedLoading = false;
  protected downloadingDocumentId: number | null = null;
  protected actionLoading = false;
  protected errorMessage: string | null = null;
  protected infoMessage = signal<string | null>(null);

  protected searchTerm = '';
  protected selectedStatus: AgentStatusFilter = 'ALL';
  protected selectedRegion = 'ALL';
  protected selectedProgramme = 'ALL';
  protected assignedOnly = false;

  protected demandes: DemandeResponse[] = [];
  protected selectedDemande: DemandeResponse | null = null;
  protected selectedDocuments: DemandePieceJointe[] = [];
  protected availableProgrammes: string[] = [];
  protected selectedWorkflowState: AgentWorkflowState | null = null;

  private readonly programmeTitles = new Map<number, string>();
  private readonly programmeCategories = new Map<number, string>();
  private readonly workflowStates = new Map<number, AgentWorkflowState>();

  protected readonly currentAgent = computed(() => this.auth.user());
  protected readonly currentAgentId = computed(() => this.currentAgent()?.id ?? null);
  protected readonly currentAgentFullName = computed(() => {
    const user = this.currentAgent();
    return user ? `${user.prenom} ${user.nom}`.trim() : '';
  });

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadDemandes();
  }

  protected get filteredDemandes(): DemandeResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.demandes.filter((demande) => {
      const matchesTerm =
        term.length === 0 ||
        demande.numero.toLowerCase().includes(term) ||
        `${demande.prenom ?? ''} ${demande.nom ?? ''}`.toLowerCase().includes(term) ||
        (demande.telephone ?? '').toLowerCase().includes(term);

      const matchesStatus = this.matchesSelectedStatus(demande.statut);
      const matchesRegion = this.selectedRegion === 'ALL' || demande.region === this.selectedRegion;
      const matchesProgramme =
        this.selectedProgramme === 'ALL' || this.getProgrammeTitle(demande) === this.selectedProgramme;
      const matchesAssigned =
        !this.assignedOnly ||
        demande.traiteParId === this.currentAgentId() ||
        demande.traiteParNom === this.currentAgentFullName();

      return matchesTerm && matchesStatus && matchesRegion && matchesProgramme && matchesAssigned;
    });
  }

  protected get regions(): string[] {
    return DEMANDE_REGIONS;
  }

  protected get programmes(): string[] {
    return this.availableProgrammes;
  }

  protected get kpis(): Array<{ label: string; value: number; status: AgentStatusFilter; accent: string }> {
    return [
      { label: 'En attente', value: this.countByStatus('EN_ATTENTE'), status: 'EN_ATTENTE', accent: 'text-slate-900' },
      { label: 'En cours', value: this.countByStatus('EN_COURS'), status: 'EN_COURS', accent: 'text-amber-700' },
      { label: 'Vérifiées', value: this.countByStatus('VERIFIEE'), status: 'VERIFIEE', accent: 'text-cyan-700' },
      { label: 'Rejetées', value: this.countByStatus('REJETEE'), status: 'REJETEE', accent: 'text-rose-700' },
       { label: 'Validées', value: this.countByStatus('VALIDEE'), status: 'VALIDEE', accent: 'text-emerald-700' }
    ];
  }

  protected applyStatusFilter(status: AgentStatusFilter): void {
    this.selectedStatus = status;
  }

  protected selectDemande(demande: DemandeResponse): void {
    if (this.selectedDemande?.id === demande.id) {
      return;
    }

    this.selectedDemande = demande;
    this.selectedDocuments = demande.piecesJointes ?? [];
    this.selectedWorkflowState = this.ensureWorkflowState(demande);
    this.infoMessage.set(null);
  }

  protected resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedRegion = 'ALL';
    this.selectedProgramme = 'ALL';
    this.assignedOnly = false;
  }

  protected getProgrammeTitle(demande: DemandeResponse): string {
    if (demande.programme?.titre) {
      return demande.programme.titre;
    }

    if (demande.programmeId) {
      return this.programmeTitles.get(demande.programmeId) ?? 'Programme non renseigné';
    }

    return 'Programme non renseigné';
  }

  protected getProgrammeCategory(demande: DemandeResponse): string {
    if (demande.programme?.categorieNom) {
      return demande.programme.categorieNom;
    }

    if (demande.programme?.id) {
      return this.programmeCategories.get(demande.programme.id) ?? 'Catégorie indisponible';
    }

    return 'Catégorie indisponible';
  }

  protected getStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadgeClass(status: string): string {
    const badgeClasses: Record<string, string> = {
      EN_ATTENTE: 'bg-slate-100 text-slate-700',
      EN_COURS: 'bg-amber-100 text-amber-700',
      VERIFIEE: 'bg-cyan-100 text-cyan-700',
      VALIDEE: 'bg-emerald-100 text-emerald-700',
      REJETEE: 'bg-rose-100 text-rose-700',
    };

    return badgeClasses[status] ?? 'bg-slate-100 text-slate-700';
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return 'date indisponible';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'date indisponible';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected getFileType(document: DemandePieceJointe): string {
    const extension = document.nomOriginal.split('.').pop()?.toLowerCase();
    if (!extension) return 'Document';
    if (extension === 'pdf') return 'PDF';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'Image';
    return extension.toUpperCase();
  }

  protected getFileIcon(document: DemandePieceJointe): string {
    const extension = document.nomOriginal.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'fa-file-pdf text-rose-500';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension ?? '')) return 'fa-file-image text-sky-500';
    return 'fa-file-lines text-slate-500';
  }

  protected downloadDocument(document: DemandePieceJointe): void {
    if (!this.selectedDemande) {
      return;
    }

    this.downloadingDocumentId = document.id;
    this.errorMessage = null;

    this.demandesApi
      .downloadAgentDocument(this.selectedDemande.id, document.id)
      .pipe(finalize(() => (this.downloadingDocumentId = null)))
      .subscribe({
        next: (response) => this.saveBlob(response, document.nomOriginal),
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  protected openDocument(document: DemandePieceJointe): void {
    if (!this.selectedDemande) {
      return;
    }

    this.downloadingDocumentId = document.id;
    this.errorMessage = null;

    this.demandesApi
      .downloadAgentDocument(this.selectedDemande.id, document.id)
      .pipe(finalize(() => (this.downloadingDocumentId = null)))
      .subscribe({
        next: (response) => this.openBlob(response, document.nomOriginal),
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  protected executeWorkflowAction(action: AgentWorkflowAction): void {
    if (!this.selectedDemande || this.actionLoading) {
      return;
    }

    const labels: Record<AgentWorkflowAction, string> = {
      PRISE_EN_CHARGE: 'prise en charge',
      EN_COURS: 'mise en instruction',
      VERIFIEE: 'vérification',
      REJETEE: 'rejet',
    };

    const demande = this.selectedDemande;
    const workflow = this.ensureWorkflowState(demande);
    const now = new Date().toISOString();
    let request;
    let fallbackPatch: Partial<DemandeResponse> = {};

    switch (action) {
      case 'PRISE_EN_CHARGE':
        request = this.demandesApi.takeInChargeDemande(demande.id);
        fallbackPatch = {
          statut: 'EN_COURS',
          traiteParId: this.currentAgentId(),
          traiteParNom: this.currentAgentFullName() || 'Agent affecté',
        };
        workflow.assignedAt = now;
        workflow.instructionStartedAt = now;
        break;
      case 'EN_COURS':
        this.infoMessage.set('La prise en charge déclenche deja la phase d\'instruction.');
        return;
      case 'VERIFIEE':
        request = this.demandesApi.verifyDemande(demande.id);
        fallbackPatch = { statut: 'VERIFIEE' };
        workflow.lastDecisionAt = now;
        workflow.lastDecisionLabel = 'Dossier vérifié par l\'agent';
        workflow.checklist.analyseFinalisee = true;
        break;
      case 'REJETEE':
        if (!workflow.rejectionReason.trim()) {
          workflow.rejectionReason = 'Motif de rejet à préciser côté backend.';
        }
        request = this.demandesApi.rejectDemande(demande.id, {
          motif: workflow.rejectionReason.trim(),
        });
        fallbackPatch = { statut: 'REJETEE' };
        workflow.lastDecisionAt = now;
        workflow.lastDecisionLabel = 'Dossier rejeté';
        break;
      default:
        this.infoMessage.set(`Action ${labels[action]} non disponible dans le flow backend actuel.`);
        return;
    }

    this.actionLoading = true;
    this.errorMessage = null;

    request.pipe(finalize(() => (this.actionLoading = false))).subscribe({
      next: (updatedDemande) => {
        this.applyServerDemandeUpdate(demande.id, fallbackPatch, updatedDemande);
        this.selectedWorkflowState = workflow;
        this.persistLocalState();
        this.infoMessage.set(`La ${labels[action]} a bien été enregistrée.`);
      },
      error: (error) => {
        this.errorMessage = this.extractError(error);
      },
    });
  }

  protected getInstructionPhaseLabel(demande: DemandeResponse): string {
    const workflow = this.ensureWorkflowState(demande);

    if (this.isValidatedStatus(demande.statut)) {
      return 'Dossier validé par l\'administration';
    }

    if (this.isVerifiedStatus(demande.statut)) {
      return 'Dossier vérifié par l\'agent, en attente de validation admin';
    }

    if (demande.statut === 'REJETEE') {
      return 'Instruction terminée avec rejet';
    }

    if (demande.statut === 'EN_COURS' || workflow.instructionStartedAt) {
      return 'Instruction en cours';
    }

    if (demande.traiteParNom || workflow.assignedAt) {
      return 'Dossier affecté à un agent';
    }

    return 'Dossier en attente de prise en charge';
  }

  protected getInstructionProgress(demande: DemandeResponse): number {
    const workflow = this.ensureWorkflowState(demande);
    const checklistValues = Object.values(workflow.checklist).filter(Boolean).length;

    if (this.isValidatedStatus(demande.statut) || this.isVerifiedStatus(demande.statut) || demande.statut === 'REJETEE') {
      return 100;
    }

    if (demande.statut === 'EN_COURS') {
      return Math.max(40, 40 + checklistValues * 15);
    }

    if (demande.traiteParNom || workflow.assignedAt) {
      return 20;
    }

    return 5;
  }

  protected hasInstructionStarted(demande: DemandeResponse): boolean {
    const workflow = this.ensureWorkflowState(demande);
    return demande.statut === 'EN_COURS' || workflow.instructionStartedAt !== null;
  }

  protected trackChecklistProgress(): void {
    if (!this.selectedDemande || !this.selectedWorkflowState) {
      return;
    }

    const completedItems = Object.values(this.selectedWorkflowState.checklist).filter(Boolean).length;
    if (completedItems >= 3 && !this.selectedWorkflowState.notes.trim()) {
      this.selectedWorkflowState.notes =
        'Analyse avancée en cours. Les vérifications principales sont presque terminées.';
    }

    this.syncSelectedDemande();
    this.persistLocalState();
  }

  protected persistWorkflowDraft(): void {
    if (!this.selectedDemande || !this.selectedWorkflowState) {
      return;
    }

    this.syncSelectedDemande();
    this.persistLocalState();
  }

  protected canTakeInCharge(demande: DemandeResponse): boolean {
    const alreadyAssigned = Boolean(
      demande.traiteParId || demande.traiteParNom || demande.prisEnChargeParNom,
    );

    return demande.statut === 'EN_ATTENTE' && !alreadyAssigned;
  }

  protected canSetInProgress(demande: DemandeResponse): boolean {
    return false;
  }

  protected canVerify(demande: DemandeResponse): boolean {
    return demande.statut === 'EN_COURS';
  }

  protected canReject(demande: DemandeResponse): boolean {
    return demande.statut === 'EN_COURS';
  }

  private countByStatus(status: AgentStatusFilter): number {
    return this.demandes.filter((demande) => demande.statut === status).length;
  }

  private ensureWorkflowState(demande: DemandeResponse): AgentWorkflowState {
    const existing = this.workflowStates.get(demande.id);
    if (existing) {
      return existing;
    }

    const state: AgentWorkflowState = {
      assignedAt: demande.traiteParNom ? demande.updatedAt ?? demande.createdAt ?? null : null,
      instructionStartedAt: demande.statut === 'EN_COURS' ? demande.updatedAt ?? demande.createdAt ?? null : null,
      lastDecisionAt: ['VALIDEE', 'VERIFIEE', 'REJETEE'].includes(demande.statut)
        ? demande.updatedAt ?? demande.createdAt ?? null
        : null,
      lastDecisionLabel:
        this.isValidatedStatus(demande.statut)
          ? 'Dossier validé par l\'administration'
          : this.isVerifiedStatus(demande.statut)
            ? 'Dossier vérifié par l\'agent'
          : demande.statut === 'REJETEE'
            ? 'Dossier rejeté'
            : null,
      notes: '',
      rejectionReason: '',
      checklist: {
        identiteVerifiee: false,
        programmeEligible: false,
        piecesConformes: false,
        analyseFinalisee: ['VALIDEE', 'VERIFIEE', 'REJETEE'].includes(demande.statut),
      },
    };

    this.workflowStates.set(demande.id, state);
    return state;
  }

  private matchesSelectedStatus(status: string): boolean {
    if (this.selectedStatus === 'ALL') {
      return true;
    }

    return status === this.selectedStatus;
  }

  private isVerifiedStatus(status: string): boolean {
    return status === 'VERIFIEE';
  }

  private isValidatedStatus(status: string): boolean {
    return status === 'VALIDEE';
  }

  private applyServerDemandeUpdate(
    id: number,
    patch: Partial<DemandeResponse>,
    updatedDemande?: DemandeResponse,
  ): void {
    const currentDemande = this.demandes.find((demande) => demande.id === id);
    if (!currentDemande) {
      return;
    }

    const mergedDemande = updatedDemande
      ? { ...currentDemande, ...updatedDemande }
      : { ...currentDemande, ...patch, updatedAt: new Date().toISOString() };

    this.demandes = this.demandes.map((demande) => (demande.id === id ? mergedDemande : demande));
    this.syncSelectedDemande();
    this.persistLocalState();
  }

  private syncSelectedDemande(): void {
    if (!this.selectedDemande) {
      return;
    }

    const updated = this.demandes.find((demande) => demande.id === this.selectedDemande?.id) ?? this.selectedDemande;
    this.selectedDemande = updated;
    this.selectedDocuments = updated.piecesJointes ?? [];
    this.selectedWorkflowState = this.ensureWorkflowState(updated);
  }

  private loadProgrammes(): void {
    this.programmeService.getAllPrograms().subscribe({
      next: (programmes) => {
        this.availableProgrammes = programmes
          .map((programme) => programme.titre?.trim())
          .filter((title): title is string => !!title)
          .sort((left, right) => left.localeCompare(right, 'fr'));

        programmes.forEach((programme) => {
          this.programmeTitles.set(Number(programme.id), programme.titre);
          this.programmeCategories.set(Number(programme.id), programme.categorieNom);
        });
      },
    });
  }

  private loadDemandes(): void {
    this.loading = true;
    this.errorMessage = null;
    this.restoreLocalState();

    this.demandesApi
      .listAgentDemandes()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (demandes) => {
          this.demandes = demandes;
          this.selectedDemande = this.demandes[0] ?? null;
          this.selectedDocuments = this.selectedDemande?.piecesJointes ?? [];
          this.selectedWorkflowState = this.selectedDemande ? this.ensureWorkflowState(this.selectedDemande) : null;

          this.infoMessage.set(null);
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
          this.selectedDemande = null;
          this.selectedDocuments = [];
          this.selectedWorkflowState = null;
        },
      });
  }

  private persistLocalState(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(
      AGENT_WORKFLOW_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(this.workflowStates.entries())),
    );
  }

  private restoreLocalState(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const rawWorkflowStates = storage.getItem(AGENT_WORKFLOW_STORAGE_KEY);
    if (rawWorkflowStates) {
      try {
        const parsed = JSON.parse(rawWorkflowStates) as Record<string, AgentWorkflowState>;
        this.workflowStates.clear();
        Object.entries(parsed).forEach(([id, workflow]) => {
          this.workflowStates.set(Number(id), workflow);
        });
      } catch {
        storage.removeItem(AGENT_WORKFLOW_STORAGE_KEY);
      }
    }

  }

  private getStorage(): Storage | null {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return null;
    }

    return globalThis.localStorage;
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

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Impossible de charger les demandes.';
    }

    return 'Impossible de charger les demandes.';
  }
}
