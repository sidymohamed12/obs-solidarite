import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  PostDto,
  PostType,
  PostUpsertPayload,
  buildPostImageUrl,
  formatPostDate,
  getPostTypeLabel,
} from '../../../public/models/article.model';
import { AdminPostsApiService } from '../services/admin-posts-api.service';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="max-w-640 mx-auto px-4 sm:px-8 lg:px-16 py-8 space-y-6">
      <header class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Administration</p>
        <h2 class="mt-2 text-2xl font-black text-slate-900">Gestion des actualités et réalisations</h2>
        <p class="mt-2 text-sm text-slate-500">Administrez les publications du site citoyen dans un espace unifié inspiré de la gestion des programmes.</p>
      </header>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Actualités</p>
          <p class="mt-3 text-3xl font-black text-slate-950">{{ actualitesCount() }}</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <p class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Réalisations</p>
          <p class="mt-3 text-3xl font-black text-cyan-700">{{ realisationsCount() }}</p>
        </article>
      </section>

      <div class="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          (click)="switchView('ACTUALITE')"
          [class]="activeView() === 'ACTUALITE' ? 'rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white' : 'rounded-full px-5 py-2 text-sm font-semibold text-slate-600'"
        >
          Actualités
        </button>
        <button
          type="button"
          (click)="switchView('REALISATION')"
          [class]="activeView() === 'REALISATION' ? 'rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white' : 'rounded-full px-5 py-2 text-sm font-semibold text-slate-600'"
        >
          Réalisations
        </button>
      </div>

      <div *ngIf="errorMessage" class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
        {{ successMessage }}
      </div>

      <section class="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Formulaire</p>
              <h3 class="mt-2 text-xl font-black text-slate-950">{{ editingPostId ? 'Modifier une publication' : 'Nouvelle publication' }}</h3>
            </div>
            <button type="button" (click)="resetPostForm()" class="text-sm font-semibold text-slate-500 hover:text-slate-900">Réinitialiser</button>
          </div>

          <form [formGroup]="postForm" (ngSubmit)="submitPost()" class="mt-5 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">Type</label>
              <select formControlName="typePost" class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                <option value="ACTUALITE">Actualité</option>
                <option value="REALISATION">Réalisation</option>
              </select>
              <p *ngIf="postFieldError('typePost')" class="mt-1 text-xs text-rose-600">Type requis.</p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">Titre</label>
              <input formControlName="titre" type="text" class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <p *ngIf="postFieldError('titre')" class="mt-1 text-xs text-rose-600">Titre requis, minimum 3 caractères.</p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
              <textarea formControlName="description" rows="6" class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"></textarea>
            </div>

            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">Image</label>
              <input type="file" accept="image/*" (change)="onImageSelected($event)" class="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700" />
              <p class="mt-2 text-xs text-slate-500">
                {{ selectedImageName || (editingPostId ? 'Aucune nouvelle image sélectionnée. L’image actuelle sera conservée.' : 'Image optionnelle au format multipart/form-data.') }}
              </p>
            </div>

            <button type="submit" [disabled]="savingPost()" class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {{ savingPost() ? 'Enregistrement...' : (editingPostId ? 'Mettre à jour' : 'Créer la publication') }}
            </button>
          </form>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Catalogue</p>
              <h3 class="mt-2 text-xl font-black text-slate-950">{{ activeView() === 'ACTUALITE' ? 'Actualités publiées' : 'Réalisations publiées' }}</h3>
            </div>
            <div class="w-full md:w-72">
              <label class="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Recherche</label>
              <input [(ngModel)]="searchTerm" [ngModelOptions]="{ standalone: true }" type="text" placeholder="Titre ou description" class="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500" />
            </div>
          </div>

          <div *ngIf="loadingPosts()" class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Chargement des publications...</div>

          <div *ngIf="!loadingPosts()" class="mt-5 grid gap-4 sm:grid-cols-2">
            <article *ngFor="let post of filteredPosts" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div class="h-36 overflow-hidden bg-slate-100">
                <img [src]="getImageUrl(post)" [alt]="post.titre" class="h-full w-full object-cover" />
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{{ getTypeLabel(post.typePost) }}</p>
                  <p class="text-xs text-slate-400">{{ formatDate(post.createdAt) }}</p>
                </div>
                <h4 class="mt-2 text-base font-black text-slate-950">{{ post.titre }}</h4>
                <p class="mt-3 line-clamp-4 text-sm text-slate-500">{{ post.description || 'Aucune description fournie.' }}</p>
                <div class="mt-4 flex items-center justify-between gap-3">
                  <span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">#{{ post.id }}</span>
                  <div class="flex items-center gap-2">
                    <button type="button" (click)="editPost(post)" class="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Modifier</button>
                    <button type="button" (click)="deletePost(post)" [disabled]="deletingPostId() === post.id" class="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                      {{ deletingPostId() === post.id ? 'Suppression...' : 'Supprimer' }}
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <div *ngIf="filteredPosts.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 sm:col-span-2">
              Aucune publication ne correspond à la recherche pour cette rubrique.
            </div>
          </div>
        </article>
      </section>
    </section>
  `,
})
export class AdminPostsComponent implements OnInit {
  private readonly api = inject(AdminPostsApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly activeView = signal<PostType>('ACTUALITE');
  protected readonly loadingPosts = signal(false);
  protected readonly savingPost = signal(false);
  protected readonly deletingPostId = signal<number | null>(null);

  protected readonly posts = signal<PostDto[]>([]);
  protected searchTerm = '';
  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected editingPostId: number | null = null;
  protected selectedImageName: string | null = null;

  protected readonly postForm = this.fb.group({
    titre: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.maxLength(5000)]],
    typePost: ['ACTUALITE' as PostType, [Validators.required]],
    image: [null as File | null],
  });

  protected readonly actualitesCount = computed(
    () => this.posts().filter((post) => post.typePost === 'ACTUALITE').length,
  );
  protected readonly realisationsCount = computed(
    () => this.posts().filter((post) => post.typePost === 'REALISATION').length,
  );

  ngOnInit(): void {
    this.loadPosts();
    this.postForm.patchValue({ typePost: this.activeView() });
  }

  protected get filteredPosts(): PostDto[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.posts().filter((post) => {
      if (post.typePost !== this.activeView()) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        post.titre.toLowerCase().includes(term) ||
        (post.description ?? '').toLowerCase().includes(term)
      );
    });
  }

  protected switchView(view: PostType): void {
    this.activeView.set(view);

    if (!this.editingPostId) {
      this.postForm.patchValue({ typePost: view });
    }

    this.errorMessage = null;
    this.successMessage = null;
  }

  protected postFieldError(field: 'titre' | 'typePost'): boolean {
    const control = this.postForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  protected getTypeLabel(type: PostType): string {
    return getPostTypeLabel(type);
  }

  protected getImageUrl(post: PostDto): string {
    return buildPostImageUrl(post.id);
  }

  protected formatDate(value: string): string {
    return formatPostDate(value);
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.postForm.patchValue({ image: file });
    this.selectedImageName = file?.name ?? null;
  }

  protected submitPost(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const request = this.editingPostId
      ? this.api.updatePost(this.editingPostId, payload)
      : this.api.createPost(payload);

    this.savingPost.set(true);
    request.pipe(finalize(() => this.savingPost.set(false))).subscribe({
      next: () => {
        this.successMessage = this.editingPostId
          ? 'Publication mise à jour avec succès.'
          : 'Publication créée avec succès.';
        this.resetPostForm();
        this.loadPosts();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible d’enregistrer cette publication.');
      },
    });
  }

  protected editPost(post: PostDto): void {
    this.editingPostId = post.id;
    this.activeView.set(post.typePost);
    this.postForm.patchValue({
      titre: post.titre,
      description: post.description ?? '',
      typePost: post.typePost,
      image: null,
    });
    this.selectedImageName = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  protected deletePost(post: PostDto): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!globalThis.confirm(`Supprimer la publication "${post.titre}" ?`)) {
      return;
    }

    this.deletingPostId.set(post.id);
    this.api.deletePost(post.id).pipe(finalize(() => this.deletingPostId.set(null))).subscribe({
      next: () => {
        if (this.editingPostId === post.id) {
          this.resetPostForm();
        }

        this.successMessage = 'Publication supprimée avec succès.';
        this.loadPosts();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de supprimer cette publication.');
      },
    });
  }

  protected resetPostForm(): void {
    this.editingPostId = null;
    this.selectedImageName = null;
    this.postForm.reset({
      titre: '',
      description: '',
      typePost: this.activeView(),
      image: null,
    });
  }

  private loadPosts(): void {
    this.loadingPosts.set(true);
    this.api.listPosts().pipe(finalize(() => this.loadingPosts.set(false))).subscribe({
      next: (posts: PostDto[]) => {
        this.posts.set(posts);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractError(error, 'Impossible de charger les publications.');
        this.posts.set([]);
      },
    });
  }

  private buildPayload(): PostUpsertPayload {
    const value = this.postForm.getRawValue();

    return {
      titre: (value.titre ?? '').trim(),
      description: (value.description ?? '').trim() || null,
      typePost: (value.typePost as PostType | null) ?? this.activeView(),
      image: value.image ?? null,
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
