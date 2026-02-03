import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface Demande {
  id: string;
  type: string;
  dateDepot: string;
  statut: 'en_cours' | 'pieces_manquantes' | 'valide' | 'cloture';
  documents: string[];
}

@Component({
  selector: 'app-list-demande',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './list-demande.component.html',
  styleUrl: './list-demande.component.css',
})
export class ListDemandeComponent {
  searchId: string = '';
  demandes: Demande[] = [
    {
      id: 'TX-2024-0892',
      type: 'Bourse Familiale',
      dateDepot: '2025-12-12',
      statut: 'en_cours',
      documents: ['CNI.pdf', 'kdo-bb.jpg'],
    },
    {
      id: 'TX-2024-0550',
      type: 'Appui Scolarité',
      dateDepot: '2025-11-05',
      statut: 'pieces_manquantes',
      documents: ['lettre_de_reco.doc'],
    },
  ];

  demandeSelectionnee: Demande = this.demandes[0];

  selectedDemande = this.demandes[0];

  rechercherDossier() {
    if (!this.searchId.trim()) return;

    const dossierTrouve = this.demandes.find(
      (d) => d.id.toLowerCase() === this.searchId.trim().toLowerCase(),
    );

    if (dossierTrouve) {
      this.selectedDemande = dossierTrouve;
    } else {
      alert('Aucun dossier trouvé avec ce numéro.');
    }
  }

  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_cours: 'En cours de traitement',
      pieces_manquantes: 'Pièces manquantes',
      valide: 'Dossier validé',
      cloture: 'Dossier clôturé',
    };
    return labels[statut] || statut;
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'en_cours':
        return 'bg-yellow-100 text-yellow-700';
      case 'valide':
        return 'bg-emerald-100 text-emerald-700';
      case 'pieces_manquantes':
        return 'bg-red-100 text-red-700';
      case 'cloture':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  getFileNameOnly(fileName: string): string {
    if (!fileName.includes('.')) return fileName;
    const parts = fileName.split('.');
    parts.pop();
    return parts.join('.');
  }

  getFileType(fileName: string): string {
    // On s'assure que fileName existe et contient un point
    if (!fileName || !fileName.includes('.')) {
      return 'Fichier inconnu';
    }

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension!.toLowerCase()) {
      case 'pdf':
        return 'PDF';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'doc':
      case 'docx':
        return 'Word';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      default:
        return 'Inconnu';
    }
  }

  getFileIcon(fileName: string): string {
    const type = this.getFileType(fileName);

    switch (type) {
      case 'PDF':
        return 'fa-file-pdf text-red-500';
      case 'Image':
        return 'fa-file-image text-sky-500';
      case 'Word':
        return 'fa-file-word text-blue-600';
      case 'Excel':
        return 'fa-file-excel text-green-600';
      default:
        return 'fa-file-alt text-slate-400';
    }
  }

  getStepFromStatus(statut: string): number {
    const workflow = {
      pieces_manquantes: 1,
      en_cours: 2,
      valide: 3,
      cloture: 4,
    };

    return workflow[statut as keyof typeof workflow] || 0;
  }
}
