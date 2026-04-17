import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  Programme,
  ProgrammeCategory,
  ProgrammeCategoryUpsertPayload,
  ProgrammeUpsertPayload,
} from '../../../public/models/programme.model';
import { AdminProgrammesApiService } from '../services/admin-programmes-api.service';

type AdminProgrammeView = 'programmes' | 'categories';

@Component({
  selector: 'app-admin-programmes',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-programmes.component.html',
})
export class AdminProgrammesComponent implements OnInit {
  private readonly api = inject(AdminProgrammesApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly activeView = signal<AdminProgrammeView>('programmes');
  protected readonly loadingProgrammes = signal(false);
  protected readonly loadingCategories = signal(false);
  protected readonly savingProgramme = signal(false);
  protected readonly savingCategory = signal(false);
  protected readonly deletingProgrammeId = signal<number | null>(null);
  protected readonly deletingCategoryId = signal<number | null>(null);

  protected programmes: Programme[] = [];
  protected categories: ProgrammeCategory[] = [];
  protected programmeSearchTerm = '';
  protected categorySearchTerm = '';
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected editingProgrammeId: number | null = null;
  protected editingCategoryId: number | null = null;

  protected readonly programmeForm = this.fb.group({
    titre: ['', [Validators.required, Validators.minLength(3)]],
    categorieId: [null as number | null, [Validators.required]],
    image: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly categoryForm = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnInit(): void {
    this.loadProgrammes();
    this.loadCategories();
  }

  protected get filteredProgrammes(): Programme[] {
    const term = this.programmeSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.programmes;
    }

    return this.programmes.filter((programme) =>
      programme.titre.toLowerCase().includes(term) ||
      programme.code.toLowerCase().includes(term) ||
      programme.categorieNom.toLowerCase().includes(term),
    );
  }

  protected get filteredCategories(): ProgrammeCategory[] {
    const term = this.categorySearchTerm.trim().toLowerCase();
    if (!term) {
      return this.categories;
    }

    return this.categories.filter((category) =>
      category.nom.toLowerCase().includes(term) ||
      category.code.toLowerCase().includes(term),
    );
  }

  protected switchView(view: AdminProgrammeView): void {
    this.activeView.set(view);
    this.errorMessage = null;
    this.successMessage = null;
  }

  protected programmeFieldError(field: string): boolean {
    const control = this.programmeForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  protected categoryFieldError(field: string): boolean {
    const control = this.categoryForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  protected submitProgramme(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.programmeForm.invalid) {
      this.programmeForm.markAllAsTouched();
      return;
    }

    const payload = this.buildProgrammePayload();
    const request = this.editingProgrammeId
      ? this.api.updateProgramme(this.editingProgrammeId, payload)
      : this.api.createProgramme(payload);

    this.savingProgramme.set(true);
    request.pipe(finalize(() => this.savingProgramme.set(false))).subscribe({
      next: () => {
        this.successMessage = this.editingProgrammeId
          ? 'Programme mis à jour avec succès.'
          : 'Programme créé avec succès.';
        this.resetProgrammeForm();
        this.loadProgrammes();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible d’enregistrer ce programme.');
      },
    });
  }

  protected submitCategory(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const payload = this.buildCategoryPayload();
    const request = this.editingCategoryId
      ? this.api.updateCategory(this.editingCategoryId, payload)
      : this.api.createCategory(payload);

    this.savingCategory.set(true);
    request.pipe(finalize(() => this.savingCategory.set(false))).subscribe({
      next: () => {
        this.successMessage = this.editingCategoryId
          ? 'Catégorie mise à jour avec succès.'
          : 'Catégorie créée avec succès.';
        this.resetCategoryForm();
        this.loadCategories();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible d’enregistrer cette catégorie.');
      },
    });
  }

  protected editProgramme(programme: Programme): void {
    this.editingProgrammeId = programme.id;
    this.programmeForm.patchValue({
      titre: programme.titre,
      categorieId: programme.categorieId,
      image: programme.image,
      description: programme.description,
    });
    this.activeView.set('programmes');
    this.successMessage = null;
    this.errorMessage = null;
  }

  protected editCategory(category: ProgrammeCategory): void {
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue({
      nom: category.nom,
      description: category.description,
    });
    this.activeView.set('categories');
    this.successMessage = null;
    this.errorMessage = null;
  }

  protected deleteProgramme(programme: Programme): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!globalThis.confirm(`Supprimer le programme "${programme.titre}" ?`)) {
      return;
    }

    this.deletingProgrammeId.set(programme.id);
    this.api.deleteProgramme(programme.id).pipe(finalize(() => this.deletingProgrammeId.set(null))).subscribe({
      next: () => {
        if (this.editingProgrammeId === programme.id) {
          this.resetProgrammeForm();
        }

        this.successMessage = 'Programme supprimé avec succès.';
        this.loadProgrammes();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de supprimer ce programme.');
      },
    });
  }

  protected deleteCategory(category: ProgrammeCategory): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!globalThis.confirm(`Supprimer la catégorie "${category.nom}" ?`)) {
      return;
    }

    this.deletingCategoryId.set(category.id);
    this.api.deleteCategory(category.id).pipe(finalize(() => this.deletingCategoryId.set(null))).subscribe({
      next: () => {
        if (this.editingCategoryId === category.id) {
          this.resetCategoryForm();
        }

        this.successMessage = 'Catégorie supprimée avec succès.';
        this.loadCategories();
        this.loadProgrammes();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de supprimer cette catégorie.');
      },
    });
  }

  protected resetProgrammeForm(): void {
    this.editingProgrammeId = null;
    this.programmeForm.reset({
      titre: '',
      categorieId: null,
      image: '',
      description: '',
    });
  }

  protected resetCategoryForm(): void {
    this.editingCategoryId = null;
    this.categoryForm.reset({
      nom: '',
      description: '',
    });
  }

  private loadProgrammes(): void {
    this.loadingProgrammes.set(true);
    this.api.listProgrammes().pipe(finalize(() => this.loadingProgrammes.set(false))).subscribe({
      next: (programmes: Programme[]) => {
        this.programmes = programmes;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de charger les programmes.');
        this.programmes = [];
      },
    });
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.api.listCategories().pipe(finalize(() => this.loadingCategories.set(false))).subscribe({
      next: (categories: ProgrammeCategory[]) => {
        this.categories = categories;
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de charger les catégories.');
        this.categories = [];
      },
    });
  }

  private buildProgrammePayload(): ProgrammeUpsertPayload {
    const value = this.programmeForm.getRawValue();
    return {
      titre: (value.titre ?? '').trim(),
      categorieId: Number(value.categorieId),
      image: (value.image ?? '').trim(),
      description: (value.description ?? '').trim(),
      active: true,
    };
  }

  private buildCategoryPayload(): ProgrammeCategoryUpsertPayload {
    const value = this.categoryForm.getRawValue();
    return {
      nom: (value.nom ?? '').trim(),
      description: (value.description ?? '').trim(),
      active: true,
    };
  }

  private extractError(error: unknown, fallbackMessage: string): string {
    if (error && typeof error === 'object') {
      const httpError = error as { message?: string; error?: { message?: string } | string };
      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }

      if (httpError.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return String((httpError.error as { message?: string }).message ?? fallbackMessage);
      }

      return httpError.message ?? fallbackMessage;
    }

    return fallbackMessage;
  }
}
