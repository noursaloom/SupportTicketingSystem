export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
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
  }
];
    redirectTo: '/login'