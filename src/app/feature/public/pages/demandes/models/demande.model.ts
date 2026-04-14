export type DemandeStatut =
  | 'EN_ATTENTE'
  | 'EN_COURS'
  | 'A_COMPLETER'
  | 'VALIDEE'
  | 'REJETEE'
  | 'CLOTUREE';

export interface DemandePayload {
  prenom: string;
  nom: string;
  telephone: string;
  numeroCinNin: string;
  region: string;
  commune: string;
  programmeId: number;
  motif: string;
  piecesJointes: File[];
}

export interface DemandePieceJointe {
  id: number;
  nomOriginal: string;
  valide: boolean;
  downloadUrl: string;
  mimeType?: string;
  size?: number;
  storageKey?: string;
}

export interface DemandeProgrammeSummary {
  id: number;
  titre: string;
  category: string;
  description: string;
  image: string;
  active: boolean;
}

export interface DemandeResponse {
  id: number;
  numero: string;
  statut: DemandeStatut | string;
  traiteParId: number | null;
  traiteParNom: string | null;
  piecesJointes: DemandePieceJointe[];
  prenom?: string;
  nom?: string;
  telephone?: string;
  numeroCinNin?: string;
  region?: string;
  commune?: string;
  programmeId?: number;
  programme?: DemandeProgrammeSummary | null;
  motif?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DemandeFormValue {
  prenom: string;
  nom: string;
  telephone: string;
  numeroCinNin: string;
  region: string;
  commune: string;
  programmeId: number | null;
  motif: string;
}

export interface DemandeProgrammeOption {
  id: number;
  label: string;
}

export const DEMANDE_REGIONS = [
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
];

export const DEMANDE_COMMUNES_BY_REGION: Record<string, string[]> = {
  Dakar: ['Dakar Plateau', 'Parcelles Assainies', 'Rufisque Est', 'Guédiawaye'],
  Diourbel: ['Diourbel', 'Bambey', 'Mbacké', 'Touba Mosquée'],
  Fatick: ['Fatick', 'Foundiougne', 'Gossas', 'Toubacouta'],
  Kaffrine: ['Kaffrine', 'Birkilane', 'Koungheul', 'Malem Hodar'],
  Kaolack: ['Kaolack', 'Guinguinéo', 'Nioro du Rip', 'Kahone'],
  Kédougou: ['Kédougou', 'Salémata', 'Saraya', 'Bandafassi'],
  Kolda: ['Kolda', 'Médina Yoro Foulah', 'Vélingara', 'Dabo'],
  Louga: ['Louga', 'Kébémer', 'Linguère', 'Sakal'],
  Matam: ['Matam', 'Kanel', 'Ranérou', 'Ourossogui'],
  'Saint-Louis': ['Saint-Louis', 'Dagana', 'Podor', 'Richard-Toll'],
  Sédhiou: ['Sédhiou', 'Bounkiling', 'Goudomp', 'Diannah Malary'],
  Tambacounda: ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum'],
  'Thiès': ['Thiès Nord', 'Mbour', 'Tivaouane', 'Joal-Fadiouth'],
  Ziguinchor: ['Ziguinchor', 'Bignona', 'Oussouye', 'Thionck Essyl'],
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  A_COMPLETER: 'Pièces à compléter',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
  CLOTUREE: 'Clôturée',
};

const STATUS_BADGES: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800',
  EN_COURS: 'bg-sky-100 text-sky-800',
  A_COMPLETER: 'bg-rose-100 text-rose-800',
  VALIDEE: 'bg-emerald-100 text-emerald-800',
  REJETEE: 'bg-slate-200 text-slate-700',
  CLOTUREE: 'bg-violet-100 text-violet-800',
};

export const getDemandeStatusLabel = (status: string): string => STATUS_LABELS[status] ?? status;

export const getDemandeStatusBadge = (status: string): string =>
  STATUS_BADGES[status] ?? 'bg-slate-100 text-slate-700';

export const toDemandeFormValue = (
  demande?: Partial<DemandeResponse> | null,
): DemandeFormValue => ({
  prenom: demande?.prenom ?? '',
  nom: demande?.nom ?? '',
  telephone: demande?.telephone ?? '',
  numeroCinNin: demande?.numeroCinNin ?? '',
  region: demande?.region ?? '',
  commune: demande?.commune ?? '',
  programmeId: demande?.programmeId ?? demande?.programme?.id ?? null,
  motif: demande?.motif ?? '',
});
