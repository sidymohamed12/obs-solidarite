import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Article } from '../../../../models/article.model';
import { ArticleService } from '../../services/article.service';
import { finalize } from 'rxjs';

interface Slide {
  image: string;
  badge: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-realisation-actualite',
  imports: [CommonModule],
  templateUrl: './realisation-actualite.component.html',
  styleUrl: './realisation-actualite.component.css',
})
export class RealisationActualiteComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  autoPlayInterval: any;

  slides: Slide[] = [
    {
      image: 'https://actu.rts.sn/wp-content/uploads/2025/10/IMG_3971.jpeg',
      badge: 'SOLIDARITÉ NATIONALE',
      title: 'Soutenir les familles face à la précarité',
      description: 'PLUS DE 10 000 MÉNAGES ASSISTÉS ET UN PARTENARIAT SANITAIRE SIGNÉ À MATAM',
    },
    {
      image:
        'https://devcommunautaire.gouv.sn/sites/default/files/gbb-uploads/Plan%20de%20travail%2048.png',
      badge: 'Santé Publique',
      title: 'Caravane Médicale : 14 régions.',
      description:
        "Plus de 10 000 consultations gratuites réalisées ce mois-ci pour garantir l'accès aux soins.",
    },
  ];

  articles: Article[] = [];
  isArticleLoading: boolean = false;

  private readonly articleService: ArticleService = inject(ArticleService);

  activeFilter = 'all';
  displayedArticles = 3;
  totalArticles = 142;

  ngOnInit(): void {
    this.startAutoPlay();
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
          this.articles = articles;
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
    this.currentSlide = (index + this.slides.length) % this.slides.length;
    this.resetAutoPlay();
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  getProgressPercentage(): number {
    return (this.displayedArticles / this.totalArticles) * 100;
  }

  onArticleClick(article: Article): void {
    console.log('Article clicked:', article);
  }
}
