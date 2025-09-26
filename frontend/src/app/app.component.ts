import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { User, UserRole } from './core/models/auth.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" *ngIf="showToolbar">
        <span>Support Ticketing System</span>
        <span class="spacer"></span>
        
        <ng-container *ngIf="currentUser">
          <button mat-button routerLink="/tickets">
            <mat-icon>confirmation_number</mat-icon>
            Tickets
          </button>
          
          <button mat-button routerLink="/tickets/create">
            <mat-icon>add</mat-icon>
            New Ticket
          </button>
          
          <button mat-button routerLink="/users" *ngIf="isAdmin">
            <mat-icon>people</mat-icon>
            Users
          </button>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <div mat-menu-item disabled class="user-info">
              <div>
                <div><strong>{{ currentUser.name }}</strong></div>
                <div class="user-email">{{ currentUser.email }}</div>
                <div class="user-role">{{ currentUser.role }}</div>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </mat-menu>
        </ng-container>
      </mat-toolbar>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .main-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .user-info {
      pointer-events: none;
      opacity: 0.8;
    }
    
    .user-email {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .user-role {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.5);
      text-transform: capitalize;
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;
  showToolbar = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Hide toolbar on auth pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showToolbar = !['/login', '/register'].includes(event.url);
    });
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Admin;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}