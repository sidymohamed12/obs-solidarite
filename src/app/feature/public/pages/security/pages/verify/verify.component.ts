import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';

const VERIFY_CODE_PATTERN = /^\d{4,6}$/;

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css',
})
export class VerifyComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected contactMessage = 'Un code de validation a été envoyé.';

  protected verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(VERIFY_CODE_PATTERN)]],
  });

  ngOnInit(): void {
    const pending = this.auth.getPendingRegistration();
    const message = this.route.snapshot.queryParamMap.get('message') ?? pending?.message ?? null;

    this.contactMessage = message ?? 'Un code de validation a été envoyé par email.';
  }

  protected fieldError(field: string): boolean {
    const ctrl = this.verifyForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected onVerify(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.auth.verifyRegistration(this.verifyForm.value.code ?? '');
  }

  protected sanitizeCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 6);
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.verifyForm.get('code')?.setValue(sanitized, { emitEvent: false });
    }
  }
}
