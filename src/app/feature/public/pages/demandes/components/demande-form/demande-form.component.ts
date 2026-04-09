import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DEMANDE_REGIONS,
  DemandeFormValue,
  DemandePayload,
  DemandePieceJointe,
  DemandeProgrammeOption,
} from '../../models/demande.model';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './demande-form.component.html',
  styleUrl: './demande-form.component.css',
})
export class DemandeFormComponent implements OnChanges {
  @Input() title = 'Nouvelle demande citoyenne';
  @Input() subtitle = 'Renseignez vos informations et joignez vos justificatifs.';
  @Input() submitLabel = 'Enregistrer';
  @Input() submitting = false;
  @Input() errorMessage: string | null = null;
  @Input() successMessage: string | null = null;
  @Input() initialValue: DemandeFormValue | null = null;
  @Input() programmes: DemandeProgrammeOption[] = [];
  @Input() existingDocuments: DemandePieceJointe[] = [];

  @Output() formSubmitted = new EventEmitter<DemandePayload>();
  @Output() downloadDocument = new EventEmitter<DemandePieceJointe>();

  protected readonly regions = DEMANDE_REGIONS;
  private readonly fb = inject(FormBuilder);
  private readonly stepOneFields = ['prenom', 'nom', 'telephone', 'numeroCinNin', 'region', 'commune'] as const;
  private readonly stepTwoFields = ['programmeId', 'motif'] as const;

  protected readonly demandeForm = this.fb.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9 ]{8,15}$')]],
    numeroCinNin: ['', [Validators.required, Validators.pattern('^[0-9]{13,15}$')]],
    region: ['', Validators.required],
    commune: ['', [Validators.required, Validators.minLength(2)]],
    programmeId: [null as number | null, [Validators.required, Validators.min(1)]],
    motif: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
  });

  protected selectedFiles: File[] = [];
  protected currentStep = 1;
  protected readonly totalSteps = 3;
  protected fileSelectionAttempted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.demandeForm.patchValue(this.initialValue);
    }
  }

  protected get motifLength(): number {
    return this.demandeForm.controls.motif.value?.length ?? 0;
  }

  protected get hasDocumentError(): boolean {
    return this.fileSelectionAttempted && this.totalDocumentsCount === 0;
  }

  protected get totalDocumentsCount(): number {
    return this.selectedFiles.length + this.existingDocuments.length;
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...files];
    this.fileSelectionAttempted = false;
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, currentIndex) => currentIndex !== index);
  }

  protected nextStep(): void {
    if (this.currentStep === this.totalSteps) {
      this.submit();
      return;
    }

    if (!this.canMoveToNextStep()) {
      return;
    }

    this.currentStep += 1;
  }

  protected prevStep(): void {
    if (this.currentStep === 1) {
      return;
    }

    this.currentStep -= 1;
  }

  protected submit(): void {
    if (this.demandeForm.invalid || this.totalDocumentsCount === 0) {
      this.demandeForm.markAllAsTouched();
      this.fileSelectionAttempted = this.totalDocumentsCount === 0;
      return;
    }

    const value = this.demandeForm.getRawValue();

    this.formSubmitted.emit({
      prenom: value.prenom ?? '',
      nom: value.nom ?? '',
      telephone: value.telephone ?? '',
      numeroCinNin: value.numeroCinNin ?? '',
      region: value.region ?? '',
      commune: value.commune ?? '',
      programmeId: Number(value.programmeId),
      motif: value.motif ?? '',
      piecesJointes: [...this.selectedFiles],
    });
  }

  protected triggerDownload(document: DemandePieceJointe): void {
    this.downloadDocument.emit(document);
  }

  protected fieldInvalid(fieldName: keyof DemandeFormValue): boolean {
    const field = this.demandeForm.get(fieldName);
    return !!field && field.touched && field.invalid;
  }

  private canMoveToNextStep(): boolean {
    if (this.currentStep === 1) {
      this.markFieldsAsTouched(this.stepOneFields);
      return this.stepOneFields.every((fieldName) => this.demandeForm.get(fieldName)?.valid);
    }

    if (this.currentStep === 2) {
      this.markFieldsAsTouched(this.stepTwoFields);
      return this.stepTwoFields.every((fieldName) => this.demandeForm.get(fieldName)?.valid);
    }

    return true;
  }

  private markFieldsAsTouched(fieldNames: readonly string[]): void {
    fieldNames.forEach((fieldName) => this.demandeForm.get(fieldName)?.markAsTouched());
  }
}
