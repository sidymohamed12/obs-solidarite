import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';

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
    code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    const pending = this.auth.getPendingRegistration();
    const channel = this.route.snapshot.queryParamMap.get('channel') ?? pending?.contactMethod ?? 'email';

    this.contactMessage =
      channel === 'phone'
        ? 'Un code de validation a été envoyé par SMS à ce numéro.'
        : 'Un code de validation a été envoyé par email.';
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
}
