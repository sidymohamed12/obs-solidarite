export interface Region {
  name: string;
  pos: [number, number];
  count: number;
  color: string;
  beneficiaries: string;
}

export interface RegionData {
  rank: number;
  name: string;
  subtitle: string;
  actions: number;
  beneficiaries: string;
  programs: number;
  progress: number;
  progressChange: string;
  progressColor: 'green' | 'yellow' | 'blue';
  icon?: string;
}
