import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  Ticket, 
  TICKET_STATUS_LABELS, 
  TICKET_PRIORITY_LABELS,
  AssignTicketRequest
} from '../../core/models/ticket.models';
import { User } from '../../core/models/auth.models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 1000px; margin: 0 auto;">
      <div class="header">
        <button mat-icon-button (click)="goBack()" style="margin-right: 1rem;">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Ticket Details</h1>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading && ticket">
        <mat-card class="ticket-detail-card">
          <mat-card-header>
            <mat-card-title>{{ ticket.title }}</mat-card-title>
            <mat-card-subtitle>
              Ticket #{{ ticket.id }} • Created {{ ticket.createdAt | date:'medium' }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="ticket-info">
              <div class="info-grid">
                <div class="info-item">
                  <label>Status</label>
                  <mat-chip [ngClass]="'status-chip ' + getStatusClass(ticket.status)">
                    {{ getStatusLabel(ticket.status) }}
                  </mat-chip>
                </div>

                <div class="info-item">
                  <label>Priority</label>
                  <mat-chip [ngClass]="'priority-chip ' + getPriorityClass(ticket.priority)">
                    {{ getPriorityLabel(ticket.priority) }}
                  </mat-chip>
                </div>

                <div class="info-item">
                  <label>Created By</label>
                  <div class="user-info">
                    <mat-icon>person</mat-icon>
                    <span>{{ ticket.createdByUser.name }} ({{ ticket.createdByUser.email }})</span>
                  </div>
                </div>

                <div class="info-item">
                  <label>Assigned To</label>
                  <div class="user-info" *ngIf="ticket.assignedToUser">
                    <mat-icon>person</mat-icon>
                    <span>{{ ticket.assignedToUser.name }} ({{ ticket.assignedToUser.email }})</span>
                  </div>
                  <span *ngIf="!ticket.assignedToUser" class="unassigned">Not assigned</span>
                </div>
              </div>

              <div class="description-section">
                <label>Description</label>
                <div class="description">{{ ticket.description }}</div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-raised-button 
              color="primary" 
              [routerLink]="['/tickets', ticket.id, 'edit']"
              *ngIf="canEditTicket()">
              <mat-icon>edit</mat-icon>
              Edit Ticket
            </button>

            <button 
              mat-button 
              color="warn" 
              (click)="confirmDelete()"
              *ngIf="canDeleteTicket()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Admin Assignment Section -->
        <mat-card class="assignment-card" *ngIf="isAdmin">
          <mat-card-header>
            <mat-card-title>Assignment</mat-card-title>
            <mat-card-subtitle>Assign this ticket to a user</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-form-field class="full-width">
              <mat-label>Assign to User</mat-label>
              <mat-select [(value)]="selectedUserId" (selectionChange)="assignTicket()">
                <mat-option value="">Unassigned</mat-option>
                <mat-option *ngFor="let user of users" [value]="user.id">
                  {{ user.name }} ({{ user.email }})
                </mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }

    .ticket-detail-card {
      margin-bottom: 2rem;
    }

    .ticket-info {
      margin-top: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .info-item label {
      display: block;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .unassigned {
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    .description-section label {
      display: block;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .description {
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .assignment-card {
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      mat-card-actions {
        flex-direction: column;
        align-items: stretch;
      }

      mat-card-actions button {
        margin: 0.25rem 0;
      }
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  ticket?: Ticket;
  loading = true;
  users: User[] = [];
  selectedUserId: number | '' = '';

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const ticketId = +params['id'];
      this.loadTicket(ticketId);
    });

    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  loadTicket(id: number): void {
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.selectedUserId = ticket.assignedToUser?.id || '';
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load ticket';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.router.navigate(['/tickets']);
      }
    });
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to load users';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  assignTicket(): void {
    if (!this.ticket) return;

    const request: AssignTicketRequest = {
      userId: this.selectedUserId as number
    };

    this.ticketService.assignTicket(this.ticket.id, request).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.snackBar.open('Ticket assignment updated!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to assign ticket';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        // Reset selection on error
        this.selectedUserId = this.ticket?.assignedToUser?.id || '';
      }
    });
  }

  confirmDelete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Ticket',
        message: 'Are you sure you want to delete this ticket? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.ticket) {
        this.deleteTicket();
      }
    });
  }

  deleteTicket(): void {
    if (!this.ticket) return;

    this.ticketService.deleteTicket(this.ticket.id).subscribe({
      next: () => {
        this.snackBar.open('Ticket deleted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to delete ticket';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  canEditTicket(): boolean {
    if (!this.ticket) return false;
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 1 || this.ticket.createdByUser.id === currentUser?.id;
  }

  canDeleteTicket(): boolean {
    if (!this.ticket) return false;
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 1 || this.ticket.createdByUser.id === currentUser?.id;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getStatusLabel(status: number): string {
    return TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS];
  }

  getPriorityLabel(priority: number): string {
    return TICKET_PRIORITY_LABELS[priority as keyof typeof TICKET_PRIORITY_LABELS];
  }

  getStatusClass(status: number): string {
    const statusMap: Record<number, string> = {
      0: 'open',
      1: 'pending',
      2: 'resolved',
      3: 'closed'
    };
    return statusMap[status] || 'open';
  }

  getPriorityClass(priority: number): string {
    const priorityMap: Record<number, string> = {
      0: 'low',
      1: 'medium',
      2: 'high'
    };
    return priorityMap[priority] || 'low';
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }
}