import { Injectable } from '@angular/core';
import { Article } from '../../../models/article.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly articles: Article[] = [
    {
      id: 1,
      type: 'actualite',
      image:
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=800',
      date: 'Il y a 2 jours',
      title: 'Inauguration du centre de réinsertion à Koumassi',
      description:
        "Le ministère renforce sa présence de proximité avec l'ouverture d'un complexe moderne dédié aux jeunes.",
    },
    {
      id: 2,
      type: 'actualite',
      image:
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800',
      date: 'Il y a 5 jours',
      title: 'Programme "Troisième Âge" : Santé étendue',
      description:
        'Nouveaux partenariats cliniques permettant une prise en charge à 100% des soins ophtalmologiques.',
    },
    {
      id: 3,
      type: 'realisation',
      image:
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800',
      date: 'Il y a 5 jours',
      title: 'Programme "Troisième Âge" : Santé étendue',
      description:
        'Nouveaux partenariats cliniques permettant une prise en charge à 100% des soins ophtalmologiques.',
    },
  ];

  getArticles(): Observable<Article[]> {
    return of(this.articles);
  }

  getArticleById(id: number): Observable<Article | undefined> {
    return of(this.articles.find((article) => article.id === id));
  }

  getArticlesByType(type: string): Observable<Article[]> {
    return of(this.articles.filter((article) => article.type === type));
  }
}
