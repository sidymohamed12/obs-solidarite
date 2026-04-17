export interface Programme {
  id: number;
  titre: string;
  // category: string;
  description: string;
  image: string;
  active: boolean;
  categorieId: number;
  categorieNom: string;
  code: string;
}

export interface ProgrammeCategory {
  id: number;
  nom: string;
  code: string;
  description: string;
}

export interface ProgrammeUpsertPayload {
  titre: string;
  description: string;
  image: string;
  categorieId: number;
  active: boolean;
}

export interface ProgrammeCategoryUpsertPayload {
  nom: string;
  description: string;
  active: boolean;
}

export interface FilterOptions {
  programs: string[];
  region: string;
}

export interface ProgramType {
  id: number;
  label: string;
  checked: boolean;
}

export interface Stats {
  livesImpacted: string;
  regionsCovered: number;
  actions: number;
  programs: number;
}
