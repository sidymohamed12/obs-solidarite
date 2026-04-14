import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DEMANDE_COMMUNES_BY_REGION,
  DEMANDE_REGIONS,
  DemandeFormValue,
  DemandePayload,
  DemandePieceJointe,
  DemandeProgrammeOption,
} from '../../models/demande.model';

type IdentityDocumentType = 'CIN' | 'NIN';

const LETTERS_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;

const containsLetterValidator = (): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value) ? null : { missingLetter: true };
};

const identityNumberValidator = (): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const parent = control.parent;
  const rawValue = String(control.value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  if (!DIGITS_ONLY_PATTERN.test(rawValue)) {
    return { digitsOnly: true };
  }

  const selectedType = (parent?.get('identityDocumentType')?.value as IdentityDocumentType | null) ?? 'CIN';

  if (selectedType === 'CIN') {
    return rawValue.length === 13 ? null : { invalidCinLength: true };
  }

  return rawValue.length === 18 ? null : { invalidNinLength: true };
};

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
  protected readonly identityDocumentTypes: IdentityDocumentType[] = ['CIN', 'NIN'];
  private readonly fb = inject(FormBuilder);
  private readonly stepOneFields = ['prenom', 'nom', 'telephone', 'identityDocumentType', 'numeroCinNin', 'region', 'commune'] as const;
  private readonly stepTwoFields = ['programmeId', 'motif'] as const;

  protected readonly demandeForm = this.fb.group({
    prenom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(LETTERS_PATTERN)]],
    nom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(LETTERS_PATTERN)]],
    telephone: ['', [Validators.required, Validators.pattern('^\\d{9}$')]],
    identityDocumentType: ['CIN' as IdentityDocumentType, Validators.required],
    numeroCinNin: ['', [Validators.required, identityNumberValidator()]],
    region: ['', Validators.required],
    commune: ['', Validators.required],
    programmeId: [null as number | null, [Validators.required, Validators.min(1)]],
    motif: [
      '',
      [Validators.required, Validators.minLength(20), Validators.maxLength(1000), containsLetterValidator()],
    ],
  });

  protected selectedFiles: File[] = [];
  protected communes: string[] = [];
  protected currentStep = 1;
  protected readonly totalSteps = 3;
  protected fileSelectionAttempted = false;
  protected fileErrorMessage: string | null = null;

  constructor() {
    this.demandeForm.controls.region.valueChanges.pipe(takeUntilDestroyed()).subscribe((region) => {
      this.updateCommunes(region ?? '');
    });

    this.demandeForm.controls.identityDocumentType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.demandeForm.controls.numeroCinNin.updateValueAndValidity();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && this.initialValue) {
      this.demandeForm.patchValue(this.initialValue);
      this.demandeForm.patchValue({
        identityDocumentType: this.detectIdentityDocumentType(this.initialValue.numeroCinNin),
      });
      this.updateCommunes(this.initialValue.region);
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

  protected get selectedIdentityDocumentType(): IdentityDocumentType {
    return (this.demandeForm.controls.identityDocumentType.value as IdentityDocumentType | null) ?? 'CIN';
  }

  protected get canAddMoreFiles(): boolean {
    return this.totalDocumentsCount < 5;
  }

  protected get canProceedCurrentStep(): boolean {
    if (this.currentStep === 1) {
      return this.stepOneFields.every((fieldName) => this.demandeForm.get(fieldName)?.valid);
    }

    if (this.currentStep === 2) {
      return this.stepTwoFields.every((fieldName) => this.demandeForm.get(fieldName)?.valid);
    }

    return this.totalDocumentsCount > 0 && this.totalDocumentsCount <= 5;
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = 5 - this.totalDocumentsCount;

    if (remainingSlots <= 0) {
      this.fileErrorMessage = 'Vous pouvez joindre au maximum 5 fichiers.';
      input.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      this.fileErrorMessage = `Vous pouvez ajouter encore ${remainingSlots} fichier(s) maximum.`;
      this.selectedFiles = [...this.selectedFiles, ...files.slice(0, remainingSlots)];
    } else {
      this.fileErrorMessage = null;
      this.selectedFiles = [...this.selectedFiles, ...files];
    }

    this.fileSelectionAttempted = false;
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, currentIndex) => currentIndex !== index);
    this.fileErrorMessage = null;
  }

  protected sanitizeLettersField(fieldName: 'prenom' | 'nom', event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '');

    if (sanitizedValue !== input.value) {
      input.value = sanitizedValue;
    }

    this.demandeForm.controls[fieldName].setValue(sanitizedValue, { emitEvent: false });
    this.demandeForm.controls[fieldName].markAsTouched();
    this.demandeForm.controls[fieldName].updateValueAndValidity();
  }

  protected sanitizeDigitsField(fieldName: 'telephone' | 'numeroCinNin', maxLength: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, maxLength);

    if (sanitizedValue !== input.value) {
      input.value = sanitizedValue;
    }

    this.demandeForm.controls[fieldName].setValue(sanitizedValue, { emitEvent: false });
    this.demandeForm.controls[fieldName].markAsTouched();
    this.demandeForm.controls[fieldName].updateValueAndValidity();
  }

  protected handleMotifInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const sanitizedValue = input.value.slice(0, 1000);

    if (sanitizedValue !== input.value) {
      input.value = sanitizedValue;
    }

    this.demandeForm.controls.motif.setValue(sanitizedValue, { emitEvent: false });
    this.demandeForm.controls.motif.markAsTouched();
    this.demandeForm.controls.motif.updateValueAndValidity();
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
    if (this.demandeForm.invalid || this.totalDocumentsCount === 0 || this.totalDocumentsCount > 5) {
      this.demandeForm.markAllAsTouched();
      this.fileSelectionAttempted = this.totalDocumentsCount === 0;
      if (this.totalDocumentsCount > 5) {
        this.fileErrorMessage = 'Vous pouvez joindre au maximum 5 fichiers.';
      }
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
    return !!field && (field.touched || field.dirty) && field.invalid;
  }

  protected controlInvalid(fieldName: string): boolean {
    const field = this.demandeForm.get(fieldName);
    return !!field && (field.touched || field.dirty) && field.invalid;
  }

  protected getIdentityNumberPlaceholder(): string {
    return this.selectedIdentityDocumentType === 'CIN' ? 'Ex: 1234567890123' : 'Ex: 123456789012345678';
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

  private updateCommunes(region: string): void {
    this.communes = DEMANDE_COMMUNES_BY_REGION[region] ?? [];

    if (!this.communes.includes(this.demandeForm.controls.commune.value ?? '')) {
      this.demandeForm.controls.commune.setValue('');
    }
  }

  private detectIdentityDocumentType(numeroCinNin: string): IdentityDocumentType {
    const digits = String(numeroCinNin ?? '').replace(/\D/g, '');
    return digits.length > 13 ? 'NIN' : 'CIN';
  }
}
