import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, from, of, throwError } from 'rxjs';
import { DemandePayload, DemandePieceJointe, DemandeResponse } from '../models/demande.model';
import { PROGRAMMES_MOCK } from '../../programme/services/programme.service';
import { DemandeDocumentStorageService } from './demande-document-storage.service';

const MOCK_DEMANDES_STORAGE_KEY = 'taxawu_mock_demandes';

interface StoredDemandeState {
  demandes: DemandeResponse[];
  documentContentByKey: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class DemandesApiService {
  private readonly documentStorage = inject(DemandeDocumentStorageService);
  private state: StoredDemandeState = this.loadState();

  listDemandes(): Observable<DemandeResponse[]> {
    return of(this.cloneDemandes(this.state.demandes)).pipe(delay(150));
  }

  listAgentDemandes(): Observable<DemandeResponse[]> {
    return of(this.cloneDemandes(this.state.demandes)).pipe(delay(150));
  }

  getDemande(id: number | string): Observable<DemandeResponse> {
    const demande = this.findDemande(id);

    if (!demande) {
      return throwError(() => ({ error: { message: 'Demande introuvable.' }, message: 'Demande introuvable.' }));
    }

    return of({ ...demande, piecesJointes: [...demande.piecesJointes] }).pipe(delay(120));
  }

  createDemande(payload: DemandePayload): Observable<DemandeResponse> {
    return from(this.createDemandeAsync(payload)).pipe(delay(180));
  }

  updateDemande(id: number | string, payload: DemandePayload): Observable<DemandeResponse> {
    return from(this.updateDemandeAsync(id, payload)).pipe(delay(180));
  }

  updateDemandeStatut(
    id: number | string,
    statut: DemandeResponse['statut'],
    traitePar?: { id: number; nom: string } | null,
  ): Observable<DemandeResponse> {
    const demandeId = Number(id);
    const current = this.findDemande(demandeId);

    if (!current) {
      return throwError(() => ({ error: { message: 'Demande introuvable.' }, message: 'Demande introuvable.' }));
    }

    const updated: DemandeResponse = {
      ...current,
      statut,
      traiteParId: traitePar?.id ?? current.traiteParId,
      traiteParNom: traitePar?.nom ?? current.traiteParNom,
      updatedAt: new Date().toISOString(),
    };

    this.state = {
      ...this.state,
      demandes: this.state.demandes.map((demande) => (demande.id === demandeId ? updated : demande)),
    };
    this.persistState();

    return of({ ...updated, piecesJointes: [...updated.piecesJointes] }).pipe(delay(150));
  }

  deleteDemande(id: number | string): Observable<void> {
    return from(this.deleteDemandeAsync(id)).pipe(delay(120));
  }

  listDocuments(id: number | string): Observable<DemandePieceJointe[]> {
    const demande = this.findDemande(id);
    if (!demande) {
      return throwError(() => ({ error: { message: 'Documents introuvables.' }, message: 'Documents introuvables.' }));
    }

    return of(demande.piecesJointes.map((document) => ({ ...document }))).pipe(delay(100));
  }

  downloadDocument(
    id: number | string,
    documentId: number | string,
  ): Observable<HttpResponse<Blob>> {
    return from(this.downloadDocumentAsync(id, documentId)).pipe(delay(120));
  }

  private async createDemandeAsync(payload: DemandePayload): Promise<DemandeResponse> {
    const now = new Date().toISOString();
    const newId = this.nextDemandeId();
    const newNumero = this.generateNumero(newId);
    const piecesJointes = await this.createPiecesJointes(newId, payload.piecesJointes);
    const programme = PROGRAMMES_MOCK.find((item) => item.id === Number(payload.programmeId)) ?? null;

    const created: DemandeResponse = {
      id: newId,
      numero: newNumero,
      statut: 'EN_ATTENTE',
      traiteParId: null,
      traiteParNom: null,
      piecesJointes,
      prenom: payload.prenom.trim(),
      nom: payload.nom.trim(),
      telephone: payload.telephone.trim(),
      numeroCinNin: payload.numeroCinNin.trim(),
      region: payload.region.trim(),
      commune: payload.commune.trim(),
      programmeId: Number(payload.programmeId),
      programme,
      motif: payload.motif.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.state = {
      ...this.state,
      demandes: [created, ...this.state.demandes],
    };
    this.persistState();

    return { ...created, piecesJointes: [...created.piecesJointes] };
  }

  private async updateDemandeAsync(id: number | string, payload: DemandePayload): Promise<DemandeResponse> {
    const demandeId = Number(id);
    const current = this.findDemande(demandeId);

    if (!current) {
      throw { error: { message: 'Demande introuvable.' }, message: 'Demande introuvable.' };
    }

    const now = new Date().toISOString();
    const newPieces = await this.createPiecesJointes(demandeId, payload.piecesJointes);
    const programme = PROGRAMMES_MOCK.find((item) => item.id === Number(payload.programmeId)) ?? null;

    const updated: DemandeResponse = {
      ...current,
      prenom: payload.prenom.trim(),
      nom: payload.nom.trim(),
      telephone: payload.telephone.trim(),
      numeroCinNin: payload.numeroCinNin.trim(),
      region: payload.region.trim(),
      commune: payload.commune.trim(),
      programmeId: Number(payload.programmeId),
      programme,
      motif: payload.motif.trim(),
      piecesJointes: [...current.piecesJointes, ...newPieces],
      updatedAt: now,
    };

    this.state = {
      ...this.state,
      demandes: this.state.demandes.map((demande) => (demande.id === demandeId ? updated : demande)),
    };
    this.persistState();

    return { ...updated, piecesJointes: [...updated.piecesJointes] };
  }

  private async deleteDemandeAsync(id: number | string): Promise<void> {
    const demandeId = Number(id);
    const current = this.findDemande(demandeId);

    if (!current) {
      throw { error: { message: 'Demande introuvable.' }, message: 'Demande introuvable.' };
    }

      await Promise.allSettled(
      current.piecesJointes
        .filter((document) => !!document.storageKey)
        .map((document) => this.documentStorage.delete(document.storageKey as string)),
    );

    const removedKeys = new Set(current.piecesJointes.map((document) => this.documentKey(demandeId, document.id)));
    const filteredContent = Object.fromEntries(
      Object.entries(this.state.documentContentByKey).filter(([key]) => !removedKeys.has(key)),
    );

    this.state = {
      demandes: this.state.demandes.filter((demande) => demande.id !== demandeId),
      documentContentByKey: filteredContent,
    };
    this.persistState();
  }

  private async downloadDocumentAsync(
    id: number | string,
    documentId: number | string,
  ): Promise<HttpResponse<Blob>> {
    const demandeId = Number(id);
    const docId = Number(documentId);
    const demande = this.findDemande(demandeId);

    if (!demande) {
      throw { error: { message: 'Demande introuvable.' }, message: 'Demande introuvable.' };
    }

    const document = demande.piecesJointes.find((piece) => piece.id === docId);
    if (!document) {
      throw { error: { message: 'Document introuvable.' }, message: 'Document introuvable.' };
    }

      let blob: Blob;

      if (document.storageKey) {
        try {
          blob = (await this.documentStorage.read(document.storageKey)) ?? this.buildFallbackBlob(demande, document);
        } catch {
          blob = this.buildFallbackBlob(demande, document);
        }
      } else {
        blob = this.buildFallbackBlob(demande, document);
      }

    return new HttpResponse<Blob>({
      body: blob,
      headers: new HttpHeaders({
        'content-disposition': `attachment; filename="${encodeURIComponent(document.nomOriginal)}"`,
      }),
      status: 200,
    });
  }

  private findDemande(id: number | string): DemandeResponse | undefined {
    return this.state.demandes.find((demande) => demande.id === Number(id));
  }

  private nextDemandeId(): number {
    return this.state.demandes.reduce((max, demande) => Math.max(max, demande.id), 0) + 1;
  }

  private nextDocumentId(): number {
    return (
      this.state.demandes
        .flatMap((demande) => demande.piecesJointes)
        .reduce((max, pieceJointe) => Math.max(max, pieceJointe.id), 0) + 1
    );
  }

  private generateNumero(id: number): string {
    return `TXW-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
  }

  private async createPiecesJointes(demandeId: number, files: File[]): Promise<DemandePieceJointe[]> {
    if (!files || files.length === 0) {
      return [];
    }

    let documentId = this.nextDocumentId();
    const pieces: DemandePieceJointe[] = [];

    for (const file of files) {
      const currentId = documentId;
      documentId += 1;

      const storageKey = this.documentKey(demandeId, currentId);
      try {
        await this.documentStorage.save(storageKey, file);
      } catch {
        this.state.documentContentByKey[storageKey] = `Fichier importé en mode statique: ${file.name}\nTaille: ${file.size} octets`;
      }

      pieces.push({
        id: currentId,
        nomOriginal: file.name,
        valide: true,
        downloadUrl: '#',
        mimeType: file.type || this.detectMimeType(file.name),
        size: file.size,
        storageKey,
      });
    }

    return pieces;
  }

  private buildFallbackBlob(demande: DemandeResponse, document: DemandePieceJointe): Blob {
    const content =
      this.state.documentContentByKey[this.documentKey(demande.id, document.id)] ??
      `Document statique: ${document.nomOriginal}\nDemande: ${demande.numero}`;

    return new Blob([content], { type: document.mimeType || 'text/plain;charset=utf-8' });
  }

  private detectMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }

  private documentKey(demandeId: number, documentId: number): string {
    return `${demandeId}:${documentId}`;
  }

  private cloneDemandes(demandes: DemandeResponse[]): DemandeResponse[] {
    return demandes.map((demande) => ({
      ...demande,
      programme: demande.programme ? { ...demande.programme } : demande.programme,
      piecesJointes: demande.piecesJointes.map((document) => ({ ...document })),
    }));
  }

  private loadState(): StoredDemandeState {
    const storage = this.getStorage();
    const fallback = this.buildInitialState();

    if (!storage) {
      return fallback;
    }

    const raw = storage.getItem(MOCK_DEMANDES_STORAGE_KEY);
    if (!raw) {
      storage.setItem(MOCK_DEMANDES_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredDemandeState>;
      if (!parsed || !Array.isArray(parsed.demandes)) {
        storage.setItem(MOCK_DEMANDES_STORAGE_KEY, JSON.stringify(fallback));
        return fallback;
      }

      return {
        demandes: this.cloneDemandes(parsed.demandes),
        documentContentByKey: parsed.documentContentByKey ?? {},
      };
    } catch {
      storage.setItem(MOCK_DEMANDES_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  private persistState(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(MOCK_DEMANDES_STORAGE_KEY, JSON.stringify(this.state));
  }

  private buildInitialState(): StoredDemandeState {
    const demandes: DemandeResponse[] = [
      {
        id: 1,
        numero: 'TXW-2026-0001',
        statut: 'EN_ATTENTE',
        traiteParId: null,
        traiteParNom: null,
        prenom: 'Mariama',
        nom: 'Sarr',
        telephone: '770010101',
        numeroCinNin: '1234567890123',
        region: 'Dakar',
        commune: 'Dakar Plateau',
        programmeId: 1,
        programme: PROGRAMMES_MOCK.find((programme) => programme.id === 1) ?? null,
        motif: 'Demande de soutien social.',
        piecesJointes: [
          {
            id: 101,
            nomOriginal: 'piece-identite.pdf',
            valide: true,
            downloadUrl: '#',
            mimeType: 'application/pdf',
            size: 184320,
          },
          {
            id: 102,
            nomOriginal: 'certificat-residence.pdf',
            valide: true,
            downloadUrl: '#',
            mimeType: 'application/pdf',
            size: 92160,
          },
        ],
        createdAt: '2026-03-10T09:30:00.000Z',
        updatedAt: '2026-03-10T09:30:00.000Z',
      },
      {
        id: 2,
        numero: 'TXW-2026-0002',
        statut: 'EN_COURS',
        traiteParId: 2,
        traiteParNom: 'Mamadou Fall',
        prenom: 'Aminata',
        nom: 'Ba',
        telephone: '770020202',
        numeroCinNin: '9876543210123',
        region: 'Thiès',
        commune: 'Thiès Nord',
        programmeId: 2,
        programme: PROGRAMMES_MOCK.find((programme) => programme.id === 2) ?? null,
        motif: 'Prise en charge santé mère-enfant.',
        piecesJointes: [
          {
            id: 201,
            nomOriginal: 'attestation-medicale.pdf',
            valide: true,
            downloadUrl: '#',
            mimeType: 'application/pdf',
            size: 110592,
          },
        ],
        createdAt: '2026-03-12T11:15:00.000Z',
        updatedAt: '2026-03-14T15:20:00.000Z',
      },
      {
        id: 3,
        numero: 'TXW-2026-0003',
        statut: 'A_COMPLETER',
        traiteParId: 2,
        traiteParNom: 'Mamadou Fall',
        prenom: 'Khadija',
        nom: 'Diop',
        telephone: '770030303',
        numeroCinNin: '4567891230456',
        region: 'Kaolack',
        commune: 'Kaolack',
        programmeId: 3,
        programme: PROGRAMMES_MOCK.find((programme) => programme.id === 3) ?? null,
        motif: 'Demande d’appui pour activité génératrice de revenus.',
        piecesJointes: [
          {
            id: 301,
            nomOriginal: 'plan-activite.pdf',
            valide: false,
            downloadUrl: '#',
            mimeType: 'application/pdf',
            size: 74240,
          },
        ],
        createdAt: '2026-03-15T08:10:00.000Z',
        updatedAt: '2026-03-18T16:45:00.000Z',
      },
    ];

    const documentContentByKey: Record<string, string> = {
      '1:101': 'Pièce d’identité - document de démonstration.',
      '1:102': 'Certificat de résidence - document de démonstration.',
      '2:201': 'Attestation médicale - document de démonstration.',
      '3:301': 'Plan d’activité - document de démonstration.',
    };

    return { demandes, documentContentByKey };
  }

  private getStorage(): Storage | null {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return null;
    }

    return globalThis.localStorage;
  }
}
