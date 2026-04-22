import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Programme } from '../../models/programme.model';
import { partners } from './constants/partners.constants';
import { ProgrammeService } from '../programme/services/programme.service';
import { Article, PostType } from '../../models/article.model';
import { ArticleService } from '../realisation-actualite/services/article.service';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent implements OnInit {
  newsList = signal<Article[]>([]);
  featuredNews = computed<Article | undefined>(() => this.newsList()[0]);
  sideNews = computed<Article[]>(() => this.newsList().slice(1, 4));
  isNewsLoading = false;

  programmes: Programme[] = [];
  isProgramsLoading: boolean = false;

  partners = partners;
  private readonly programmeService: ProgrammeService = inject(ProgrammeService);
  private readonly actualiteService: ArticleService = inject(ArticleService);

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadNews();
  }

  loadProgrammes(): void {
    this.isProgramsLoading = true;
    this.programmeService
      .get3Programs()
      .pipe(finalize(() => (this.isProgramsLoading = false)))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes;
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  loadNews(): void {
    this.isNewsLoading = true;
    this.actualiteService
      .getArticlesByType('ACTUALITE' as PostType)
      .pipe(finalize(() => (this.isNewsLoading = false)))
      .subscribe({
        next: (articles) => {
          this.newsList.set(articles.slice(0, 4));
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  extractAcronym(titre: string): string | null {
    const match = titre.match(/\(([^)]+)\)$/);
    return match ? match[1] : null;
  }

  getGradientClass(index: number): string {
    const gradients = [
      'from-primary via-primary/40',
      'from-yellow-600 via-yellow-600/40',
      'from-red-900 via-red-900/40',
    ];

    return gradients[index % gradients.length];
  }
}
