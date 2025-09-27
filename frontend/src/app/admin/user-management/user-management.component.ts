import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

import { AuthService } from '../../core/services/auth.service';
import { User, UserRole, USER_ROLE_LABELS } from '../../core/models/auth.models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from '../../users/user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
      <div class="header">
        <div class="title-section">
          <h1>
            <mat-icon>admin_panel_settings</mat-icon>
            User Management
          </h1>
          <p class="subtitle">Manage system users, roles, and permissions</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
          <mat-icon>person_add</mat-icon>
          Create User
        </button>
      </div>

      <div class="stats-cards" *ngIf="!loading">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon admin">admin_panel_settings</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getStatsByRole(UserRole.Admin) }}</div>
                <div class="stat-label">Admins</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon receiver">support_agent</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getStatsByRole(UserRole.TicketReceiver) }}</div>
                <div class="stat-label">Ticket Receivers</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon applier">person</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getStatsByRole(UserRole.TicketApplier) }}</div>
                <div class="stat-label">Ticket Appliers</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon total">people</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ users.length }}</div>
                <div class="stat-label">Total Users</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <mat-card *ngIf="!loading" class="users-table-card">
        <mat-card-header>
          <mat-card-title>All Users</mat-card-title>
          <mat-card-subtitle>Manage user accounts and permissions</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="users" class="users-table" matSort>
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-avatar">
                    <mat-icon>account_circle</mat-icon>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [ngClass]="getRoleClass(user.role)">
                    <mat-icon>{{ getRoleIcon(user.role) }}</mat-icon>
                    {{ getRoleLabel(user.role) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let user">
                  <div class="date-info">
                    <div class="date">{{ user.createdAt | date:'mediumDate' }}</div>
                    <div class="time">{{ user.createdAt | date:'shortTime' }}</div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip class="status-active">
                    <mat-icon>check_circle</mat-icon>
                    Active
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <div class="action-buttons">
                    <button 
                      mat-icon-button 
                      color="primary" 
                      (click)="openEditUserDialog(user)"
                      matTooltip="Edit User">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button 
                      mat-icon-button 
                      color="warn" 
                      (click)="confirmDeleteUser(user)"
                      matTooltip="Delete User"
                      [disabled]="user.id === currentUserId">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="user-row"></tr>
            </table>
          </div>

          <div *ngIf="users.length === 0" class="no-users">
            <mat-icon style="font-size: 48px; opacity: 0.3;">people</mat-icon>
            <h3>No users found</h3>
            <p>Create the first user to get started.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem 0;
      color: #1976d2;
    }

    .subtitle {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .stat-icon.admin { color: #4caf50; }
    .stat-icon.receiver { color: #ff9800; }
    .stat-icon.applier { color: #2196f3; }
    .stat-icon.total { color: #9c27b0; }

    .stat-info {
      flex: 1;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .users-table-card {
      margin-top: 1rem;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
    }

    .user-row:hover {
      background-color: #f5f5f5;
    }

    .user-avatar mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #666;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date {
      font-weight: 500;
    }

    .time {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .role-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &.ticket-applier {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      
      &.ticket-receiver {
        background-color: #fff3e0;
        color: #f57c00;
      }
      
      &.admin {
        background-color: #e8f5e8;
        color: #388e3c;
      }
    }

    .status-active {
      background-color: #e8f5e8;
      color: #388e3c;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .no-users {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .users-table {
        font-size: 0.875rem;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = true;
  displayedColumns: string[] = ['avatar', 'name', 'role', 'createdAt', 'status', 'actions'];
  UserRole = UserRole;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get currentUserId(): number {
    return this.authService.getCurrentUser()?.id || 0;
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load users';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  getStatsByRole(role: UserRole): number {
    return this.users.filter(user => user.role === role).length;
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  confirmDeleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user.id);
      }
    });
  }

  deleteUser(userId: number): void {
    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully!', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to delete user';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  getRoleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role] || 'Unknown';
  }

  getRoleClass(role: UserRole): string {
    const roleClassMap: Record<UserRole, string> = {
      [UserRole.TicketApplier]: 'role-chip ticket-applier',
      [UserRole.TicketReceiver]: 'role-chip ticket-receiver',
      [UserRole.Admin]: 'role-chip admin'
    };
    return roleClassMap[role] || 'role-chip';
  }

  getRoleIcon(role: UserRole): string {
    const roleIconMap: Record<UserRole, string> = {
      [UserRole.TicketApplier]: 'person',
      [UserRole.TicketReceiver]: 'support_agent',
      [UserRole.Admin]: 'admin_panel_settings'
    };
    return roleIconMap[role] || 'person';
  }
}