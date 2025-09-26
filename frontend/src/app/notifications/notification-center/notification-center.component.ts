import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';

import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification.models';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <div class="header">
        <h1>
          <mat-icon>notifications</mat-icon>
          Notifications
        </h1>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading && notifications.length === 0" class="no-notifications">
        <mat-icon style="font-size: 48px; opacity: 0.3;">notifications_none</mat-icon>
        <h3>No notifications</h3>
        <p>You're all caught up! New notifications will appear here.</p>
      </div>

      <mat-card *ngIf="!loading && notifications.length > 0">
        <mat-card-content>
          <mat-list>
            <mat-list-item 
              *ngFor="let notification of notifications; trackBy: trackByNotificationId"
              class="notification-item"
              [class.unread]="!notification.isRead"
              (click)="onNotificationClick(notification)">
              
              <mat-icon matListItemIcon [ngClass]="getNotificationIconClass(notification.type)">
                {{ getNotificationIcon(notification.type) }}
              </mat-icon>
              
              <div matListItemTitle class="notification-content">
                <div class="notification-header">
                  <span class="notification-message">{{ notification.message }}</span>
                  <mat-chip 
                    class="notification-type-chip"
                    [ngClass]="getNotificationTypeClass(notification.type)">
                    {{ notification.typeDisplayName }}
                  </mat-chip>
                </div>
                
                <div class="notification-meta">
                  <span class="ticket-title">{{ notification.ticket.title }}</span>
                  <span class="notification-time">{{ notification.createdAt | date:'short' }}</span>
                </div>
              </div>

              <button 
                mat-icon-button 
                *ngIf="!notification.isRead"
                (click)="markAsRead(notification, $event)"
                matTooltip="Mark as read"
                class="mark-read-btn">
                <mat-icon>done</mat-icon>
              </button>

              <div *ngIf="!notification.isRead" class="unread-indicator"></div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .no-notifications {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .notification-item {
      cursor: pointer;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #e0e0e0;
      position: relative;
      padding: 1rem;
    }

    .notification-item:hover {
      background-color: #f5f5f5;
    }

    .notification-item.unread {
      background-color: #f8f9ff;
      border-left: 4px solid #1976d2;
    }

    .notification-item.unread:hover {
      background-color: #f0f2ff;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .notification-message {
      font-weight: 500;
      line-height: 1.4;
      flex: 1;
    }

    .notification-type-chip {
      font-size: 0.75rem;
      height: 24px;
      flex-shrink: 0;
    }

    .notification-type-chip.created {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .notification-type-chip.assigned {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .notification-type-chip.status-changed {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .notification-type-chip.updated {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .ticket-title {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
    }

    .notification-time {
      font-size: 0.75rem;
    }

    .mark-read-btn {
      opacity: 0.7;
    }

    .mark-read-btn:hover {
      opacity: 1;
    }

    .unread-indicator {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      background-color: #1976d2;
      border-radius: 50%;
    }

    .notification-icon.created {
      color: #1976d2;
    }

    .notification-icon.assigned {
      color: #f57c00;
    }

    .notification-icon.status-changed {
      color: #388e3c;
    }

    .notification-icon.updated {
      color: #c2185b;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .notification-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .notification-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `]
})
export class NotificationCenterComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load notifications';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read if not already read
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
    
    // Navigate to ticket details
    this.router.navigate(['/tickets', notification.ticketId]);
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        // Update the notification in the list
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = updatedNotification;
        }
        
        // Refresh unread count
        this.notificationService.refreshUnreadCount();
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to mark notification as read';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.TicketCreated:
        return 'add_circle';
      case NotificationType.TicketAssigned:
        return 'assignment_ind';
      case NotificationType.TicketStatusChanged:
        return 'update';
      case NotificationType.TicketUpdated:
        return 'edit';
      default:
        return 'notifications';
    }
  }

  getNotificationIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.TicketCreated:
        return 'notification-icon created';
      case NotificationType.TicketAssigned:
        return 'notification-icon assigned';
      case NotificationType.TicketStatusChanged:
        return 'notification-icon status-changed';
      case NotificationType.TicketUpdated:
        return 'notification-icon updated';
      default:
        return 'notification-icon';
    }
  }

  getNotificationTypeClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.TicketCreated:
        return 'created';
      case NotificationType.TicketAssigned:
        return 'assigned';
      case NotificationType.TicketStatusChanged:
        return 'status-changed';
      case NotificationType.TicketUpdated:
        return 'updated';
      default:
        return '';
    }
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}