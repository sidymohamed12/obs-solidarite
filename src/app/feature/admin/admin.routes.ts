import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';
import { AdminLayoutComponent } from '../../layout/admin-layout/admin-layout.component';
import { AgentDemandesComponent } from './pages/agent-demandes/agent-demandes.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['AGENT', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'demandes', pathMatch: 'full' },
      { path: 'demandes', component: AgentDemandesComponent, title: 'Back office demandes' },
    ],
  },
];
