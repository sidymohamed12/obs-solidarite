import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly profileMenuOpen = signal(false);
  protected readonly currentUser = computed(() => this.auth.user());
  protected readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  protected readonly isAgent = computed(() => this.currentUser()?.role === 'AGENT');
  protected readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.prenom} ${user.nom}`.trim() : 'Compte utilisateur';
  });
  protected readonly brandSubtitle = computed(() =>
    this.isAdmin() ? 'Espace Administration' : 'Espace Agent'
  );
  protected readonly navItems = computed(() => {
    if (this.isAdmin()) {
      return [
        { label: 'Demandes', link: '/admin/demandes' },
        { label: 'Agents', link: '/admin/agents' },
        { label: 'Citoyens', link: '/admin/citoyens' },
      ];
    }

    return [{ label: 'Demandes', link: '/admin/agent/demandes' }];
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
