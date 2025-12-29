export interface Program {
  id: string;
  title: string;
  description: string;
  icon: string;
  beneficiaries: string;
  color: string;
  bgColor: string;
  iconBg: string;
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
