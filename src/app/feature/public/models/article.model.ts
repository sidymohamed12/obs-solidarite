import { API_ENDPOINTS } from '../../../core/config/api.config';

export type PostType = 'ACTUALITE' | 'REALISATION';
export type ArticleType = 'actualite' | 'realisation';

export interface PostDto {
  id: number;
  titre: string;
  description: string | null;
  typePost: PostType;
  createdAt: string;
  updatedAt: string;
}

export interface PostUpsertPayload {
  titre: string;
  description?: string | null;
  typePost: PostType;
  image?: File | null;
}

export interface Article {
  id: number;
  type: ArticleType;
  typeLabel: string;
  image: string;
  date: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
}

export const buildPostImageUrl = (id: number | string): string => API_ENDPOINTS.posts.image(id);

export const mapPostTypeToArticleType = (typePost: PostType): ArticleType =>
  typePost === 'ACTUALITE' ? 'actualite' : 'realisation';

export const getPostTypeLabel = (typePost: PostType): string =>
  typePost === 'ACTUALITE' ? 'Actualité' : 'Réalisation';

export const formatPostDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date indisponible';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const mapPostToArticle = (post: PostDto, index = 0): Article => ({
  id: post.id,
  type: mapPostTypeToArticleType(post.typePost),
  typeLabel: getPostTypeLabel(post.typePost),
  image: buildPostImageUrl(post.id),
  date: formatPostDate(post.createdAt),
  title: post.titre,
  description: post.description?.trim() || 'Contenu à découvrir.',
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  isFeatured: index === 0,
});
