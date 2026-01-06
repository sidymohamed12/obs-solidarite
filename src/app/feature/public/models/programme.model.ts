export interface Programme {
  id: string;
  titre: string;
  category: string;
  description: string;
  image: string;
}

export interface FilterOptions {
  programs: string[];
  region: string;
}

export interface ProgramType {
  id: string;
  label: string;
  checked: boolean;
}

export interface Stats {
  livesImpacted: string;
  regionsCovered: number;
  actions: number;
  programs: number;
}
