import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-logout',
  imports: [],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <svg class="animate-spin w-8 h-8 text-[#047857]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
        <p class="text-gray-600 text-lg font-medium">Déconnexion en cours…</p>
      </div>
    </div>
  `,
})
export class LogoutComponent implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.logout();
  }
}
