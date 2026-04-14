import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly profileMenuOpen = signal(false);
  protected readonly currentUser = computed(() => this.auth.user());
  protected readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.prenom} ${user.nom}`.trim() : 'Compte agent';
  });
  protected readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    if (role === 'AGENT') {
      return 'Agent';
    }

    return 'Compte';
  });
  protected readonly currentUserInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'AG';
    }

    return `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || 'AG';
  });

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  protected closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.closeProfileMenu();
  }

  protected logout(): void {
    this.closeProfileMenu();
    this.auth.logout();
  }
}
