import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ArticleService } from '../../services/article.service';
import { finalize } from 'rxjs';
import { Article, PostType } from '../../../../models/article.model';

interface Slide {
  image: string;
  badge: string;
  title: string;
  description: string;
}

type ArticleFilter = 'all' | 'actualite' | 'realisation';

@Component({
  selector: 'app-realisation-actualite',
  imports: [CommonModule],
  templateUrl: './realisation-actualite.component.html',
  styleUrl: './realisation-actualite.component.css',
})
export class RealisationActualiteComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  slides: Slide[] = [];
  articles = signal<Article[]>([]);
  activeFilter = signal<ArticleFilter>('all');
  filteredArticles = computed(() => {
    if (this.activeFilter() === 'all') {
      return this.articles();
    }

    return this.articles().filter((article) => article.type === this.activeFilter());
  });
  isArticleLoading = false;

  private readonly articleService: ArticleService = inject(ArticleService);

  ngOnInit(): void {
    this.loadArticles();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  loadArticles(): void {
    this.isArticleLoading = true;
    this.articleService
      .getArticles()
      .pipe(finalize(() => (this.isArticleLoading = false)))
      .subscribe({
        next: (articles) => {
          this.articles.set(articles);
          this.slides = articles.slice(0, 3).map((article) => ({
            image: article.image,
            badge: article.typeLabel.toUpperCase(),
            title: article.title,
            description: article.description,
          }));

          if (this.slides.length > 1) {
            this.startAutoPlay();
          }
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 8000);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  showSlide(index: number): void {
    if (this.slides.length === 0) {
      return;
    }

    this.currentSlide = (index + this.slides.length) % this.slides.length;
    this.resetAutoPlay();
  }

  nextSlide(): void {
    if (this.slides.length === 0) {
      return;
    }

    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    if (this.slides.length === 0) {
      return;
    }

    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter as ArticleFilter);
  }

  onArticleClick(article: Article): void {
    console.log('Article clicked:', article);
  }

  protected loadType(type: PostType): void {
    this.isArticleLoading = true;
    this.articleService
      .getArticlesByType(type)
      .pipe(finalize(() => (this.isArticleLoading = false)))
      .subscribe({
        next: (articles) => {
          this.articles.set(articles);
        },
        error: (error) => {
          console.error(error);
        },
      });
  }
}
