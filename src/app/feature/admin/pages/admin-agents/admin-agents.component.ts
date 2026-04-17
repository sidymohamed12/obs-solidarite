import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RegisterRequest, UserDto } from '../../../../core/auth/models/auth.models';
import { AuthService } from '../../../../core/auth/services/auth.service';

const LETTERS_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;
const PHONE_PATTERN = /^\+?[0-9 ]{8,15}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-admin-agents',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-agents.component.html',
  styleUrl: './admin-agents.component.css',
})
export class AdminAgentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected createAgentForm!: FormGroup;
  protected agents: UserDto[] = [];
  protected formMessage: { type: 'success' | 'error'; text: string } | null = null;
  protected creatingAgent = false;
  protected loadingAgents = false;
  protected actingAgentId: number | null = null;
  protected searchTerm = '';
  protected selectedStatusFilter = 'ALL';

  ngOnInit(): void {
    this.initForm();
    this.loadAgents();
  }

  protected fieldError(field: string): boolean {
    const ctrl = this.createAgentForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected sanitizeLettersField(field: 'prenom' | 'nom', event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.createAgentForm.get(field)?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizeUsername(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-z0-9._-]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.createAgentForm.get('username')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^0-9+ ]/g, '');
    sanitized = sanitized.replace(/(?!^)\+/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.createAgentForm.get('phoneNumber')?.setValue(sanitized, { emitEvent: false });
    }
  }

  protected trimControl(field: 'prenom' | 'nom' | 'username' | 'email' | 'phoneNumber'): void {
    const control = this.createAgentForm.get(field);
    const value = control?.value;
    if (control && typeof value === 'string') {
      control.setValue(value.trim(), { emitEvent: false });
    }
  }

  protected createAgent(): void {
    this.formMessage = null;

    if (this.createAgentForm.invalid) {
      this.createAgentForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, email, phoneNumber, ...rest } = this.createAgentForm.value;
    const payload: RegisterRequest = {
      ...rest,
      username: (rest.username ?? '').trim(),
      prenom: (rest.prenom ?? '').trim(),
      nom: (rest.nom ?? '').trim(),
      email: (email ?? '').trim().toLowerCase(),
      password: rest.password,
      ...(phoneNumber?.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
    };

    this.creatingAgent = true;
    this.auth.createAgent(payload)
      .pipe(finalize(() => (this.creatingAgent = false)))
      .subscribe({
        next: (result) => {
          this.formMessage = {
            type: 'success',
            text: result.message,
          };
          this.createAgentForm.reset();
          this.createAgentForm.patchValue({ email: '', phoneNumber: '' });
          this.loadAgents();
        },
        error: (error: unknown) => {
          this.formMessage = {
            type: 'error',
            text: error instanceof Error ? error.message : 'Impossible de créer l\'agent.',
          };
        },
      });
  }

  protected isAgentActive(agent: UserDto): boolean {
    return agent.active !== false;
  }

  protected get filteredAgents(): UserDto[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.agents.filter((agent) => {
      const matchesTerm =
        term.length === 0 ||
        `${agent.prenom ?? ''} ${agent.nom ?? ''}`.toLowerCase().includes(term) ||
        agent.username.toLowerCase().includes(term) ||
        agent.email.toLowerCase().includes(term) ||
        agent.phoneNumber.toLowerCase().includes(term);

      const isActive = this.isAgentActive(agent);
      const matchesStatus =
        this.selectedStatusFilter === 'ALL' ||
        (this.selectedStatusFilter === 'ACTIVE' && isActive) ||
        (this.selectedStatusFilter === 'INACTIVE' && !isActive);

      return matchesTerm && matchesStatus;
    });
  }

  protected resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatusFilter = 'ALL';
  }

  protected toggleAgentStatus(agent: UserDto): void {
    this.formMessage = null;
    this.actingAgentId = agent.id;

    const request = this.isAgentActive(agent)
      ? this.auth.deactivateAgent(agent.id)
      : this.auth.activateAgent(agent.id);

    request.pipe(finalize(() => (this.actingAgentId = null))).subscribe({
      next: (response) => {
        this.agents = this.agents.map((item) =>
          item.id === agent.id ? { ...item, active: !this.isAgentActive(agent) } : item,
        );
        this.formMessage = {
          type: 'success',
          text: response.message,
        };
      },
      error: (error: unknown) => {
        this.formMessage = {
          type: 'error',
          text: error instanceof Error ? error.message : 'Impossible de mettre à jour le statut de cet agent.',
        };
      },
    });
  }

  private initForm(): void {
    this.createAgentForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
        prenom: ['', [Validators.required, Validators.pattern(LETTERS_PATTERN)]],
        nom: ['', [Validators.required, Validators.pattern(LETTERS_PATTERN)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
        confirmPassword: ['', Validators.required],
        phoneNumber: ['', [Validators.pattern(PHONE_PATTERN)]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private loadAgents(): void {
    this.loadingAgents = true;
    this.auth.listAdminAgents()
      .pipe(finalize(() => (this.loadingAgents = false)))
      .subscribe({
        next: (agents: UserDto[]) => {
          this.agents = agents;
        },
        error: (error: unknown) => {
          this.formMessage = {
            type: 'error',
            text: error instanceof Error ? error.message : 'Impossible de charger la liste des agents.',
          };
          this.agents = [];
        },
      });
  }

  private passwordMatchValidator(form: FormGroup): { passwordMismatch: true } | null {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }
}
