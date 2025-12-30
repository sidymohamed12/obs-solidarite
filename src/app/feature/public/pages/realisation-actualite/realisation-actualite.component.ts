import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

interface Slide {
  image: string;
  badge: string;
  title: string;
  description: string;
}

interface Article {
  id: number;
  type: 'news' | 'stats' | 'regular';
  image?: string;
  badge?: string;
  date?: string;
  title: string;
  description?: string;
  tags?: string;
  stats?: {
    label: string;
    value: string;
    percentage: number;
  };
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
      title: 'Caravane Médicale : 15 régions.',
      description:
        "Plus de 10 000 consultations gratuites réalisées ce mois-ci pour garantir l'accès aux soins.",
    },
  ];

  articles: Article[] = [
    {
      id: 1,
      type: 'news',
      image:
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=800',
      badge: 'Actualité',
      date: 'Il y a 2 jours',
      title: 'Inauguration du centre de réinsertion à Koumassi',
      description:
        "Le ministère renforce sa présence de proximité avec l'ouverture d'un complexe moderne dédié aux jeunes.",
      tags: '#Social #Jeunesse',
    },
    {
      id: 2,
      type: 'stats',
      title: 'Bilan Chiffré 2025 : 1.2M de kits distribués',
      stats: {
        label: 'Objectif Atteint',
        value: '94%',
        percentage: 94,
      },
    },
    {
      id: 3,
      type: 'news',
      image:
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800',
      badge: 'Actualité',
      date: 'Il y a 5 jours',
      title: 'Programme "Troisième Âge" : Santé étendue',
      description:
        'Nouveaux partenariats cliniques permettant une prise en charge à 100% des soins ophtalmologiques.',
      tags: '#Sante #Seniors',
    },
  ];

  activeFilter = 'all';
  displayedArticles = 3;
  totalArticles = 142;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
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
    // Ici vous pouvez ajouter la logique de filtrage des articles
  }

  loadMoreArticles(): void {
    this.displayedArticles += 3;
    // Ici vous pouvez charger plus d'articles depuis un service
  }

  getProgressPercentage(): number {
    return (this.displayedArticles / this.totalArticles) * 100;
  }

  onArticleClick(article: Article): void {
    console.log('Article clicked:', article);
    // Naviguez vers la page de détail de l'article
  }
}
