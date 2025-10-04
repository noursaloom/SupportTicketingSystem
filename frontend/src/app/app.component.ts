import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs/operators';

import { AuthService, AppUser } from './core/services/auth.service';
import { NotificationService, Notification } from './core/services/notification.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule
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

          <button mat-button routerLink="/tickets/create" *ngIf="canCreateTickets">
            <mat-icon>add</mat-icon>
            New Ticket
          </button>

          <button mat-button routerLink="/users" *ngIf="isManager">
            <mat-icon>people</mat-icon>
            User Management
          </button>

          <button mat-button routerLink="/projects" *ngIf="isManager">
            <mat-icon>folder</mat-icon>
            Projects
          </button>

          <button
            mat-icon-button
            [matMenuTriggerFor]="notificationMenu"
            matTooltip="Notifications"
            (click)="loadNotifications()">
            <mat-icon [matBadge]="unreadCount" [matBadgeHidden]="unreadCount === 0" matBadgeColor="warn">
              notifications
            </mat-icon>
          </button>

          <mat-menu #notificationMenu="matMenu" class="notification-menu">
            <div class="notification-header" mat-menu-item disabled>
              <h3>Notifications</h3>
              <button mat-button routerLink="/notifications" (click)="closeNotificationMenu()">
                View All
              </button>
            </div>
            <mat-divider></mat-divider>

            <div *ngIf="loadingNotifications" class="notification-loading" mat-menu-item disabled>
              <mat-spinner diameter="20"></mat-spinner>
              <span>Loading...</span>
            </div>

            <div *ngIf="!loadingNotifications && recentNotifications.length === 0"
                 class="no-notifications" mat-menu-item disabled>
              <mat-icon>notifications_none</mat-icon>
              <span>No new notifications</span>
            </div>

            <div *ngFor="let notification of recentNotifications.slice(0, 5)"
                 class="notification-item"
                 [class.unread]="!notification.isRead"
                 mat-menu-item
                 (click)="onNotificationClick(notification)">
              <div class="notification-content">
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-meta">
                  <span class="notification-time">{{ notification.createdAt | date:'short' }}</span>
                  <mat-icon *ngIf="!notification.isRead" class="unread-dot">fiber_manual_record</mat-icon>
                </div>
              </div>
            </div>

            <mat-divider *ngIf="recentNotifications.length > 0"></mat-divider>
            <button mat-menu-item routerLink="/notifications" (click)="closeNotificationMenu()">
              <mat-icon>list</mat-icon>
              View All Notifications
            </button>
          </mat-menu>

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <div mat-menu-item disabled class="user-info">
              <div>
                <div><strong>{{ currentUser.fullName }}</strong></div>
                <div class="user-email">{{ currentUser.email }}</div>
                <div class="user-role">{{ getRoleLabel(currentUser.role) }}</div>
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

    .spacer {
      flex: 1;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
    }

    .user-info {
      pointer-events: none;
      opacity: 0.8;
      padding: 8px 16px;
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

    ::ng-deep .notification-menu {
      width: 400px;
      max-height: 500px;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #f5f5f5;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .notification-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      justify-content: center;
    }

    .no-notifications {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: rgba(0, 0, 0, 0.6);
      justify-content: center;
    }

    .notification-item {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: #f5f5f5;
    }

    .notification-item.unread {
      background-color: #f8f9ff;
      border-left: 3px solid #1976d2;
    }

    .notification-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notification-message {
      font-size: 0.875rem;
      line-height: 1.4;
      color: #333;
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-time {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .unread-dot {
      font-size: 8px;
      width: 8px;
      height: 8px;
      color: #1976d2;
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: AppUser | null = null;
  showToolbar = true;
  unreadCount = 0;
  recentNotifications: Notification[] = [];
  loadingNotifications = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      const navEnd = event as NavigationEnd;
      this.showToolbar = !['/login', '/register'].includes(navEnd.url);
    });
  }

  get isManager(): boolean {
    return this.currentUser?.role === 'manager';
  }

  get canCreateTickets(): boolean {
    return this.currentUser?.role === 'applier' || this.currentUser?.role === 'manager';
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'applier': return 'Ticket Applier';
      case 'receiver': return 'Ticket Receiver';
      case 'manager': return 'Project Manager';
      default: return role;
    }
  }

  loadNotifications(): void {
    if (!this.currentUser) return;

    this.loadingNotifications = true;
    this.notificationService.getNotifications(this.currentUser.id).subscribe({
      next: (notifications) => {
        this.recentNotifications = notifications.slice(0, 5);
        this.loadingNotifications = false;
      },
      error: () => {
        this.loadingNotifications = false;
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          if (this.currentUser) {
            this.notificationService.refreshUnreadCount(this.currentUser.id);
          }
        }
      });
    }

    if (notification.ticketId) {
      this.router.navigate(['/tickets', notification.ticketId]);
    }
  }

  closeNotificationMenu(): void {
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
