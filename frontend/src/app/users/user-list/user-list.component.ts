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

import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/auth.models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <div class="header">
        <h1>User Management</h1>
        <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
          <mat-icon>person_add</mat-icon>
          Create User
        </button>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <mat-card *ngIf="!loading">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="users" class="users-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let user">{{ user.name }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{ user.email }}</td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [ngClass]="getRoleClass(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
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
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
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
      align-items: center;
      margin-bottom: 2rem;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
    }

    .no-users {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .role-chip {
      &.admin {
        background-color: #e8f5e8;
        color: #388e3c;
      }
      
      &.user {
        background-color: #e3f2fd;
        color: #1976d2;
      }
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

      .users-table {
        font-size: 0.875rem;
      }
    }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'email', 'role', 'createdAt', 'actions'];

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
    return role === UserRole.Admin ? 'Admin' : 'User';
  }

  getRoleClass(role: UserRole): string {
    return role === UserRole.Admin ? 'role-chip admin' : 'role-chip user';
  }
}