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
import { DemandesApiService } from '../../../public/pages/demandes/services/demandes-api.service';
import { ProgrammeService } from '../../../public/pages/programme/services/programme.service';

type AgentStatusFilter = 'ALL' | 'EN_ATTENTE' | 'EN_COURS' | 'A_COMPLETER' | 'VALIDEE' | 'REJETEE' | 'CLOTUREE';
type AgentWorkflowAction = 'PRISE_EN_CHARGE' | 'EN_COURS' | 'A_COMPLETER' | 'VALIDEE' | 'REJETEE';
const AGENT_WORKFLOW_STORAGE_KEY = 'taxawu_agent_workflow_state';
const AGENT_DEMANDE_PATCHES_STORAGE_KEY = 'taxawu_agent_demande_patches';

interface AgentWorkflowChecklist {
  identiteVerifiee: boolean;
  programmeEligible: boolean;
  piecesConformes: boolean;
  analyseFinalisee: boolean;
}

interface AgentWorkflowState {
  assignedAt: string | null;
  instructionStartedAt: string | null;
  completionRequestedAt: string | null;
  lastDecisionAt: string | null;
  lastDecisionLabel: string | null;
  notes: string;
  completionReason: string;
  rejectionReason: string;
  checklist: AgentWorkflowChecklist;
}

type PersistedDemandePatch = Partial<
  Pick<DemandeResponse, 'id' | 'statut' | 'traiteParId' | 'traiteParNom' | 'updatedAt'>
>;

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
  private readonly demandePatches = new Map<number, PersistedDemandePatch>();

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

      const matchesStatus = this.selectedStatus === 'ALL' || demande.statut === this.selectedStatus;
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
      { label: 'À compléter', value: this.countByStatus('A_COMPLETER'), status: 'A_COMPLETER', accent: 'text-orange-700' },
      { label: 'Validées', value: this.countByStatus('VALIDEE'), status: 'VALIDEE', accent: 'text-emerald-700' },
      { label: 'Rejetées', value: this.countByStatus('REJETEE'), status: 'REJETEE', accent: 'text-rose-700' },
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
    if (demande.programme?.category) {
      return demande.programme.category;
    }

    if (demande.programmeId) {
      return this.programmeCategories.get(demande.programmeId) ?? 'Catégorie indisponible';
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
      A_COMPLETER: 'bg-orange-100 text-orange-700',
      VALIDEE: 'bg-sky-100 text-sky-700',
      REJETEE: 'bg-rose-100 text-rose-700',
      CLOTUREE: 'bg-emerald-100 text-emerald-700',
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
      .downloadDocument(this.selectedDemande.id, document.id)
      .pipe(finalize(() => (this.downloadingDocumentId = null)))
      .subscribe({
        next: (response) => this.saveBlob(response, document.nomOriginal),
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  protected executeWorkflowAction(action: AgentWorkflowAction): void {
    if (!this.selectedDemande) {
      return;
    }

    const labels: Record<AgentWorkflowAction, string> = {
      PRISE_EN_CHARGE: 'prise en charge',
      EN_COURS: 'mise en instruction',
      A_COMPLETER: 'demande de pièces complémentaires',
      VALIDEE: 'validation',
      REJETEE: 'rejet',
    };

    const demande = this.selectedDemande;
    const workflow = this.ensureWorkflowState(demande);
    const now = new Date().toISOString();

    switch (action) {
      case 'PRISE_EN_CHARGE':
        this.applyDemandePatch(demande.id, {
          traiteParId: this.currentAgentId(),
          traiteParNom: this.currentAgentFullName() || 'Agent affecté',
        });
        workflow.assignedAt = now;
        break;
      case 'EN_COURS':
        this.applyDemandePatch(demande.id, {
          statut: 'EN_COURS',
          traiteParId: this.currentAgentId(),
          traiteParNom: this.currentAgentFullName() || demande.traiteParNom,
        });
        workflow.assignedAt ??= now;
        workflow.instructionStartedAt = now;
        break;
      case 'A_COMPLETER':
        this.applyDemandePatch(demande.id, { statut: 'A_COMPLETER' });
        workflow.completionRequestedAt = now;
        workflow.lastDecisionAt = now;
        workflow.lastDecisionLabel = 'Compléments demandés';
        if (!workflow.completionReason.trim()) {
          workflow.completionReason = 'Pièces ou informations complémentaires à fournir.';
        }
        break;
      case 'VALIDEE':
        this.applyDemandePatch(demande.id, { statut: 'VALIDEE' });
        workflow.lastDecisionAt = now;
        workflow.lastDecisionLabel = 'Dossier validé';
        workflow.checklist.analyseFinalisee = true;
        break;
      case 'REJETEE':
        this.applyDemandePatch(demande.id, { statut: 'REJETEE' });
        workflow.lastDecisionAt = now;
        workflow.lastDecisionLabel = 'Dossier rejeté';
        if (!workflow.rejectionReason.trim()) {
          workflow.rejectionReason = 'Motif de rejet à préciser côté backend.';
        }
        break;
    }

    this.selectedWorkflowState = workflow;
    this.persistLocalState();

    this.infoMessage.set(
      `Simulation front: ${labels[action]} appliquée visuellement sur le dossier. Le branchement backend reste à faire.`
    );
  }

  protected getInstructionPhaseLabel(demande: DemandeResponse): string {
    const workflow = this.ensureWorkflowState(demande);

    if (demande.statut === 'VALIDEE') {
      return 'Instruction terminée avec validation';
    }

    if (demande.statut === 'REJETEE') {
      return 'Instruction terminée avec rejet';
    }

    if (demande.statut === 'A_COMPLETER') {
      return 'En attente de compléments du citoyen';
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

    if (demande.statut === 'VALIDEE' || demande.statut === 'REJETEE') {
      return 100;
    }

    if (demande.statut === 'A_COMPLETER') {
      return 75;
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
    return demande.statut === 'EN_COURS' || demande.statut === 'A_COMPLETER' || workflow.instructionStartedAt !== null;
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
    return !demande.traiteParNom;
  }

  protected canSetInProgress(demande: DemandeResponse): boolean {
    return ['EN_ATTENTE', 'A_COMPLETER'].includes(demande.statut);
  }

  protected canRequestCompletion(demande: DemandeResponse): boolean {
    return demande.statut === 'EN_COURS';
  }

  protected canValidate(demande: DemandeResponse): boolean {
    return ['EN_COURS', 'A_COMPLETER'].includes(demande.statut);
  }

  protected canReject(demande: DemandeResponse): boolean {
    return ['EN_COURS', 'A_COMPLETER'].includes(demande.statut);
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
      completionRequestedAt: demande.statut === 'A_COMPLETER' ? demande.updatedAt ?? null : null,
      lastDecisionAt: ['VALIDEE', 'REJETEE', 'A_COMPLETER'].includes(demande.statut)
        ? demande.updatedAt ?? demande.createdAt ?? null
        : null,
      lastDecisionLabel:
        demande.statut === 'VALIDEE'
          ? 'Dossier validé'
          : demande.statut === 'REJETEE'
            ? 'Dossier rejeté'
            : demande.statut === 'A_COMPLETER'
              ? 'Compléments demandés'
              : null,
      notes: '',
      completionReason: '',
      rejectionReason: '',
      checklist: {
        identiteVerifiee: false,
        programmeEligible: false,
        piecesConformes: false,
        analyseFinalisee: ['VALIDEE', 'REJETEE'].includes(demande.statut),
      },
    };

    this.workflowStates.set(demande.id, state);
    return state;
  }

  private applyDemandePatch(id: number, patch: Partial<DemandeResponse>): void {
    const updatedAt = new Date().toISOString();
    this.demandes = this.demandes.map((demande) =>
      demande.id === id ? { ...demande, ...patch, updatedAt } : demande,
    );
    const currentPatch = this.demandePatches.get(id) ?? { id };
    this.demandePatches.set(id, { ...currentPatch, ...patch, updatedAt });
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
          this.demandes = demandes.map((demande) => {
            const patch = this.demandePatches.get(demande.id);
            return patch ? { ...demande, ...patch } : demande;
          });
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
    storage.setItem(
      AGENT_DEMANDE_PATCHES_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(this.demandePatches.entries())),
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

    const rawDemandePatches = storage.getItem(AGENT_DEMANDE_PATCHES_STORAGE_KEY);
    if (rawDemandePatches) {
      try {
        const parsed = JSON.parse(rawDemandePatches) as Record<string, PersistedDemandePatch>;
        this.demandePatches.clear();
        Object.entries(parsed).forEach(([id, patch]) => {
          this.demandePatches.set(Number(id), patch);
        });
      } catch {
        storage.removeItem(AGENT_DEMANDE_PATCHES_STORAGE_KEY);
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

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Impossible de charger les demandes.';
    }

    return 'Impossible de charger les demandes.';
  }
}
