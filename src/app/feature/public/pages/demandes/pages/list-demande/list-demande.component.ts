import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import {
  DemandePieceJointe,
  DemandeResponse,
  getDemandeStatusLabel,
} from '../../models/demande.model';
import { DemandesApiService } from '../../services/demandes-api.service';
import { ProgrammeService } from '../../../programme/services/programme.service';

interface CitizenTimelineStep {
  label: string;
  icon: string;
  circleClass: string;
  labelClass: string;
  connectorClass?: string;
}

@Component({
  selector: 'app-list-demande',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './list-demande.component.html',
  styleUrl: './list-demande.component.css',
})
export class ListDemandeComponent implements OnInit {
  private readonly demandesApi = inject(DemandesApiService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected searchId = '';
  protected loading = false;
  protected selectedLoading = false;
  protected downloadingDocumentId: number | null = null;
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected demandes: DemandeResponse[] = [];
  protected selectedDemande: DemandeResponse | null = null;
  protected selectedDocuments: DemandePieceJointe[] = [];
  private programmeCategories = new Map<number, string>();

  ngOnInit(): void {
    this.successMessage = this.route.snapshot.queryParamMap.get('message');
    this.loadProgrammes();
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
    switch (status) {
      case 'EN_ATTENTE':
        return 'Dépôt';
      case 'EN_COURS':
        return 'Instruction';
      case 'VALIDEE':
      case 'VERIFIEE':
        return 'Validation';
      case 'REJETEE':
        return 'Rejetée';
      default:
        return getDemandeStatusLabel(status);
    }
  }

  protected getListStatusLabel(status: string): string {
    return getDemandeStatusLabel(status);
  }

  protected getStatusBadgeClass(status: string): string {
    const badgeClasses: Record<string, string> = {
      EN_ATTENTE: 'text-slate-700',
      EN_COURS: 'text-amber-700',
      VALIDEE: 'text-emerald-700',
      VERIFIEE: 'text-emerald-700',
      REJETEE: 'text-red-700',
    };

    return badgeClasses[status] ?? 'text-slate-700';
  }

  protected rechercherDossier(): void {
    const match = this.filteredDemandes[0];

    if (!match) {
      this.errorMessage = 'Aucune demande ne correspond à ce numéro.';
      return;
    }

    this.selectDemande(match);
  }

  protected selectDemande(demande: DemandeResponse): void {
    if (this.selectedDemande?.id === demande.id) {
      return;
    }

    this.loadSelectedDemande(demande.id);
  }

  protected getProgrammeCategory(demande: DemandeResponse | null | undefined): string {
    if (demande?.programme?.categorieNom) {
      return demande.programme.categorieNom;
    }

    const programmeId = demande?.programmeId;

    if (!programmeId) {
      return 'Aide sociale';
    }

    return this.programmeCategories.get(programmeId) ?? 'Aide sociale';
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
    }).format(date);
  }

  protected getTimelineSteps(status: string): CitizenTimelineStep[] {
    if (status === 'REJETEE') {
      return [
        {
          label: 'Dépôt',
          icon: 'fas fa-folder-open',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-slate-900',
          connectorClass: 'bg-emerald-600',
        },
        {
          label: 'Instruction',
          icon: 'fas fa-search',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-slate-900',
          connectorClass: 'bg-red-500',
        },
        {
          label: 'Rejetée',
          icon: 'fas fa-xmark',
          circleClass: 'bg-red-500 text-white',
          labelClass: 'text-red-600',
          connectorClass: 'bg-gray-100',
        },
        {
          label: 'Terminée',
          icon: 'fas fa-flag-checkered',
          circleClass: 'bg-gray-100 text-gray-400',
          labelClass: 'text-gray-400',
        },
      ];
    }

    if (status === 'VALIDEE' || status === 'VERIFIEE') {
      return [
        {
          label: 'Dépôt',
          icon: 'fas fa-folder-open',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-slate-900',
          connectorClass: 'bg-emerald-600',
        },
        {
          label: 'Instruction',
          icon: 'fas fa-search',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-slate-900',
          connectorClass: 'bg-emerald-600',
        },
        {
          label: 'Validation',
          icon: 'fas fa-file-signature',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-emerald-700',
          connectorClass: 'bg-gray-100',
        },
        {
          label: 'Terminée',
          icon: 'fas fa-flag-checkered',
          circleClass: 'bg-gray-100 text-gray-400',
          labelClass: 'text-gray-400',
        },
      ];
    }

    if (status === 'EN_COURS') {
      return [
        {
          label: 'Dépôt',
          icon: 'fas fa-folder-open',
          circleClass: 'bg-emerald-600 text-white',
          labelClass: 'text-slate-900',
          connectorClass: 'bg-emerald-600',
        },
        {
          label: 'Instruction',
          icon: 'fas fa-search',
          circleClass: 'border-4 border-emerald-600 bg-white text-emerald-600',
          labelClass: 'text-emerald-700',
          connectorClass: 'bg-gray-100',
        },
        {
          label: 'Validation',
          icon: 'fas fa-file-signature',
          circleClass: 'bg-gray-100 text-gray-400',
          labelClass: 'text-gray-400',
          connectorClass: 'bg-gray-100',
        },
        {
          label: 'Terminée',
          icon: 'fas fa-flag-checkered',
          circleClass: 'bg-gray-100 text-gray-400',
          labelClass: 'text-gray-400',
        },
      ];
    }

    return [
      {
        label: 'Dépôt',
        icon: 'fas fa-folder-open',
        circleClass: 'border-4 border-emerald-600 bg-white text-emerald-600',
        labelClass: 'text-emerald-700',
        connectorClass: 'bg-gray-100',
      },
      {
        label: 'Instruction',
        icon: 'fas fa-search',
        circleClass: 'bg-gray-100 text-gray-400',
        labelClass: 'text-gray-400',
        connectorClass: 'bg-gray-100',
      },
      {
        label: 'Validation',
        icon: 'fas fa-file-signature',
        circleClass: 'bg-gray-100 text-gray-400',
        labelClass: 'text-gray-400',
        connectorClass: 'bg-gray-100',
      },
      {
        label: 'Terminée',
        icon: 'fas fa-flag-checkered',
        circleClass: 'bg-gray-100 text-gray-400',
        labelClass: 'text-gray-400',
      },
    ];
  }

  protected getFileNameOnly(document: DemandePieceJointe): string {
    return document.nomOriginal;
  }

  protected getFileType(document: DemandePieceJointe): string {
    const extension = document.nomOriginal.split('.').pop()?.toLowerCase();

    if (!extension) {
      return 'Document';
    }

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (extension === 'pdf') {
      return 'PDF';
    }

    if (imageExtensions.includes(extension)) {
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
        next: (response) => {
          this.saveBlob(response, document.nomOriginal);
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
          this.hydrateDemandesWithProgrammeId(demandes);

          if (demandes.length > 0) {
            this.loadSelectedDemande(demandes[0].id);
          }
        },
        error: (error) => {
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private loadProgrammes(): void {
    this.programmeService.getPrograms().subscribe({
      next: (programmes) => {
        this.programmeCategories = new Map(
          programmes.map((programme) => [Number(programme.id), programme.categorieNom]),
        );
      },
      error: () => {
        this.programmeCategories = new Map();
      },
    });
  }

  private loadSelectedDemande(id: number): void {
    this.selectedLoading = true;
    this.errorMessage = null;

    this.demandesApi
      .getDemande(id)
      .pipe(finalize(() => (this.selectedLoading = false)))
      .subscribe({
        next: (demande) => {
          this.selectedDemande = demande;
          this.selectedDocuments = demande.piecesJointes;
          this.demandes = this.demandes.map((item) => (item.id === demande.id ? { ...item, ...demande } : item));
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
        this.selectedDocuments = documents;
      },
      error: () => {
        if (this.selectedDemande) {
          this.selectedDocuments = this.selectedDemande.piecesJointes;
        }
      },
    });
  }

  private hydrateDemandesWithProgrammeId(demandes: DemandeResponse[]): void {
    const demandesSansProgramme = demandes.filter((demande) => !demande.programmeId);

    if (demandesSansProgramme.length === 0) {
      return;
    }

    forkJoin(
      demandesSansProgramme.map((demande) =>
        this.demandesApi.getDemande(demande.id).pipe(
          map((detail) => ({ id: demande.id, detail })),
          catchError(() => of({ id: demande.id, detail: null }))
        )
      )
    ).subscribe({
      next: (details) => {
        const detailMap = new Map(
          details
            .filter((entry) => entry.detail)
            .map((entry) => [entry.id, entry.detail as DemandeResponse]),
        );

        this.demandes = this.demandes.map((demande) => {
          const detail = detailMap.get(demande.id);
          return detail ? { ...demande, ...detail } : demande;
        });
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

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string }; message?: string };
      return httpError.error?.message ?? httpError.message ?? 'Impossible de charger les demandes.';
    }

    return 'Impossible de charger les demandes.';
  }
}
