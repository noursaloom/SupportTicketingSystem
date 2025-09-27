import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tickets',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'tickets',
    loadComponent: () => import('./tickets/ticket-list/ticket-list.component').then(c => c.TicketListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tickets/create',
    loadComponent: () => import('./tickets/ticket-form/ticket-form.component').then(c => c.TicketFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tickets/:id',
    loadComponent: () => import('./tickets/ticket-detail/ticket-detail.component').then(c => c.TicketDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tickets/:id/edit',
    loadComponent: () => import('./tickets/ticket-form/ticket-form.component').then(c => c.TicketFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list/user-list.component').then(c => c.UserListComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'projects',
    loadComponent: () => import('./projects/project-list/project-list.component').then(c => c.ProjectListComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./admin/user-management/user-management.component').then(c => c.UserManagementComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/projects',
    loadComponent: () => import('./admin/project-management/project-management.component').then(c => c.ProjectManagementComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notification-center/notification-center.component').then(c => c.NotificationCenterComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/tickets'
  }
];