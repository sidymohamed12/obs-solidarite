import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../../../core/config/api.config';
import { DemandePayload, DemandePieceJointe, DemandeResponse } from '../models/demande.model';

@Injectable({
  providedIn: 'root',
})
export class DemandesApiService {
  private readonly http = inject(HttpClient);

  listDemandes(): Observable<DemandeResponse[]> {
    return this.http.get<DemandeResponse[]>(API_ENDPOINTS.demandes.base);
  }

  getDemande(id: number | string): Observable<DemandeResponse> {
    return this.http.get<DemandeResponse>(API_ENDPOINTS.demandes.byId(id));
  }

  createDemande(payload: DemandePayload): Observable<DemandeResponse> {
    return this.http.post<DemandeResponse>(API_ENDPOINTS.demandes.base, this.toFormData(payload));
  }

  updateDemande(id: number | string, payload: DemandePayload): Observable<DemandeResponse> {
    return this.http.put<DemandeResponse>(API_ENDPOINTS.demandes.byId(id), this.toFormData(payload));
  }

  deleteDemande(id: number | string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.demandes.byId(id));
  }

  listDocuments(id: number | string): Observable<DemandePieceJointe[]> {
    return this.http.get<DemandePieceJointe[]>(API_ENDPOINTS.demandes.documents(id));
  }

  downloadDocument(
    id: number | string,
    documentId: number | string,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(API_ENDPOINTS.demandes.downloadDocument(id, documentId), {
      observe: 'response',
      responseType: 'blob',
    });
  }

  private toFormData(payload: DemandePayload): FormData {
    const formData = new FormData();

    formData.append('prenom', payload.prenom.trim());
    formData.append('nom', payload.nom.trim());
    formData.append('telephone', payload.telephone.trim());
    formData.append('numeroCinNin', payload.numeroCinNin.trim());
    formData.append('region', payload.region.trim());
    formData.append('commune', payload.commune.trim());
    formData.append('programmeId', String(payload.programmeId));
    formData.append('motif', payload.motif.trim());

    payload.piecesJointes.forEach((file) => formData.append('piecesJointes', file, file.name));

    return formData;
  }
}
