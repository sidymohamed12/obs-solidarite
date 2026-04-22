import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  readonly profileMenuOpen = signal(false);
  readonly currentUser = computed(() => this.auth.user());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isAgent = computed(() => this.currentUser()?.role === 'AGENT');
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.prenom} ${user.nom}`.trim() : 'Compte utilisateur';
  });
  readonly brandSubtitle = computed(() =>
    this.isAdmin() ? 'Espace Administration' : 'Espace Agent'
  );
  readonly navItems = computed(() => {
    if (this.isAdmin()) {
      return [
        { label: 'Demandes', link: '/admin/demandes' },
        { label: 'Agents', link: '/admin/agents' },
        { label: 'Programmes', link: '/admin/programmes' },
        { label: 'Publications', link: '/admin/publications' },
      ];
    }

    return [{ label: 'Demandes', link: '/admin/agent/demandes' }];
  });
  readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    if (role === 'AGENT') {
      return 'Agent';
    }

    return 'Compte';
  });
  readonly currentUserInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'AG';
    }

    return `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || 'AG';
  });

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProfileMenu();
  }

  logout(): void {
    this.closeProfileMenu();
    this.auth.logout();
  }
}
