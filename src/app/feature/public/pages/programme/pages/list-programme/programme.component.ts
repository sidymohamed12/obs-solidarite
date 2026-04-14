import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Programme } from '../../../../models/programme.model';
import { ProgrammeService } from '../../services/programme.service';

type ProgrammePageItem = number | 'ellipsis';

@Component({
  selector: 'app-programme',
  imports: [RouterLink],
  templateUrl: './programme.component.html',
  styleUrl: './programme.component.css',
})
export class ProgrammeComponent implements OnInit {
  programmes: Programme[] = [];
  categories: string[] = [];
  isProgramsLoading: boolean = false;
  errorMessage: string | null = null;
  selectedCategory: string = 'all';
  readonly pageSize: number = 6;
  currentPage: number = 1;
  private readonly programmeService: ProgrammeService = inject(ProgrammeService);

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadCategories();
  }

  loadProgrammes(): void {
    this.isProgramsLoading = true;
    this.errorMessage = null;
    this.programmeService
      .getPrograms()
      .pipe(finalize(() => (this.isProgramsLoading = false)))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes;
          this.currentPage = 1;
        },
        error: (error) => {
          this.errorMessage = 'Impossible de charger les programmes pour le moment.';
          console.error(error);
        },
      });
  }

  loadCategories(): void {
    this.programmeService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  get filteredProgrammes(): Programme[] {
    if (this.selectedCategory === 'all') {
      return this.programmes;
    }

    return this.programmes.filter((programme) => programme.categorieNom === this.selectedCategory);
  }

  get paginatedProgrammes(): Programme[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProgrammes.slice(startIndex, startIndex + this.pageSize);
  }

  get totalProgrammes(): number {
    return this.programmes.length;
  }

  get totalCategories(): number {
    return this.categories.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProgrammes.length / this.pageSize));
  }

  get displayedProgramsCount(): number {
    return this.paginatedProgrammes.length;
  }

  get visibleRangeStart(): number {
    if (this.filteredProgrammes.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get visibleRangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProgrammes.length);
  }

  get paginationItems(): ProgrammePageItem[] {
    const totalPages = this.totalPages;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (this.currentPage <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }

    if (this.currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', this.currentPage, 'ellipsis', totalPages];
  }

  selectCategory(category: string): void {
    if (this.selectedCategory === category) {
      return;
    }

    this.selectedCategory = category;
    this.currentPage = 1;
  }

  isSelectedCategory(category: string): boolean {
    return this.selectedCategory === category;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}
