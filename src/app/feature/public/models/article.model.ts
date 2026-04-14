export interface Article {
  id: number;
  type: 'actualite' | 'realisation';
  image?: string;
  date?: string;
  title: string;
  description?: string;
  isFeatured?: boolean;
}
