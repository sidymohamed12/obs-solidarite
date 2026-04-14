export interface Programme {
  id: number;
  titre: string;
  category: string;
  description: string;
  image: string;
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
