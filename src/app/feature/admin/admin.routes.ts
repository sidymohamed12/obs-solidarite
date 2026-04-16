import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';
import { AdminLayoutComponent } from '../../layout/admin-layout/admin-layout.component';
import { AgentDemandesComponent } from './pages/agent-demandes/agent-demandes.component';
import { AdminDemandesComponent } from './pages/admin-demandes/admin-demandes.component';
import { AdminAgentsComponent } from './pages/admin-agents/admin-agents.component';
import { AdminCitoyensComponent } from './pages/admin-citoyens/admin-citoyens.component';
import { AdminProgrammesComponent } from './pages/admin-programmes/admin-programmes.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'agent',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['AGENT'])],
    children: [
      { path: '', redirectTo: 'demandes', pathMatch: 'full' },
      { path: 'demandes', component: AgentDemandesComponent, title: 'Espace agent - Demandes' },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'demandes', pathMatch: 'full' },
      { path: 'demandes', component: AdminDemandesComponent, title: 'Administration - Demandes' },
      { path: 'agents', component: AdminAgentsComponent, title: 'Administration - Agents' },
      { path: 'programmes', component: AdminProgrammesComponent, title: 'Administration - Programmes' },
      { path: 'citoyens', component: AdminCitoyensComponent, title: 'Administration - Citoyens' },
    ],
  },
];
