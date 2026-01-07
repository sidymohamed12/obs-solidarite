import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-demande',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-demande.component.html',
  styleUrl: './add-demande.component.css',
})
export class AddDemandeComponent {
  registrationForm: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  isSubmitted = false;
  uploadedFiles: File[] = [];

  regions = [
    'Dakar',
    'Diourbel',
    'Fatick',
    'Kaffrine',
    'Kaolack',
    'Kédougou',
    'Kolda',
    'Louga',
    'Matam',
    'Saint-Louis',
    'Sédhiou',
    'Tambacounda',
    'Thiès',
    'Ziguinchor',
  ];

  constructor(private readonly fb: FormBuilder) {
    this.registrationForm = this.fb.group({
      // Étape 1 : Identité
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern('^(77|78|70|76|75)[0-9]{7}$')]],
      cin: ['', [Validators.required, Validators.pattern('^[0-9]{13,15}$')]],
      region: ['', Validators.required],
      commune: ['', Validators.required],

      // Étape 2 : Besoin
      programme: ['', Validators.required],
      motif: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],

      // Étape 3 : Documents
      hasFiles: [false, Validators.requiredTrue],
    });
  }

  // Accès facile aux contrôles
  get f() {
    return this.registrationForm.controls;
  }

  nextStep() {
    if (this.isStepValid(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.submit();
      }
    } else {
      this.markStepAsTouched(this.currentStep);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    const fields = this.getFieldsByStep(step);
    return fields.every((field) => this.registrationForm.get(field)?.valid);
  }

  markStepAsTouched(step: number) {
    const fields = this.getFieldsByStep(step);
    fields.forEach((field) => this.registrationForm.get(field)?.markAsTouched());
  }

  private getFieldsByStep(step: number): string[] {
    if (step === 1) return ['firstName', 'lastName', 'phone', 'cin', 'region', 'commune'];
    if (step === 2) return ['programme', 'motif'];
    if (step === 3) return ['hasFiles'];
    return [];
  }

  onFileChange(event: any) {
    const files = event.target.files as File[];
    if (files.length > 0) {
      this.uploadedFiles = [...this.uploadedFiles, ...files];
      this.registrationForm.patchValue({ hasFiles: true });
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length === 0) {
      this.registrationForm.patchValue({ hasFiles: false });
    }
  }

  submit() {
    if (this.registrationForm.valid) {
      this.isSubmitted = true;
      console.log('Données envoyées :', this.registrationForm.value);
    }
  }
}
