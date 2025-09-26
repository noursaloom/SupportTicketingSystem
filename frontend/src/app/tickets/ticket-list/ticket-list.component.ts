import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  Ticket, 
  TicketStatus, 
  TicketPriority, 
  TICKET_STATUS_LABELS, 
  TICKET_PRIORITY_LABELS 
} from '../../core/models/ticket.models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="container" style="padding: 2rem;">
      <div class="header">
        <h1>Support Tickets</h1>
        <button mat-raised-button color="primary" routerLink="/tickets/create">
          <mat-icon>add</mat-icon>
          Create Ticket
        </button>
      </div>

      <div class="filters" *ngIf="tickets.length > 0">
        <mat-form-field>
          <mat-label>Filter by Status</mat-label>
          <mat-select [(value)]="statusFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option *ngFor="let status of statusOptions" [value]="status.value">
              {{ status.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Filter by Priority</mat-label>
          <mat-select [(value)]="priorityFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All Priorities</mat-option>
            <mat-option *ngFor="let priority of priorityOptions" [value]="priority.value">
              {{ priority.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading && filteredTickets.length === 0" class="no-tickets">
        <mat-icon style="font-size: 48px; opacity: 0.3;">confirmation_number</mat-icon>
        <h3>No tickets found</h3>
        <p *ngIf="tickets.length === 0">Create your first support ticket to get started.</p>
        <p *ngIf="tickets.length > 0">Try adjusting your filters to see more tickets.</p>
      </div>

      <div class="tickets-grid" *ngIf="!loading && filteredTickets.length > 0">
        <mat-card 
          *ngFor="let ticket of filteredTickets" 
          class="ticket-card"
          [routerLink]="['/tickets', ticket.id]">
          
          <mat-card-header>
            <mat-card-title>{{ ticket.title }}</mat-card-title>
            <mat-card-subtitle>
              Created by {{ ticket.createdByUser.name }} • 
              {{ ticket.createdAt | date:'short' }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p class="description">{{ ticket.description | slice:0:150 }}{{ ticket.description.length > 150 ? '...' : '' }}</p>
            
            <div class="ticket-meta">
              <mat-chip-set>
                <mat-chip [ngClass]="'status-chip ' + getStatusClass(ticket.status)">
                  {{ getStatusLabel(ticket.status) }}
                </mat-chip>
                <mat-chip [ngClass]="'priority-chip ' + getPriorityClass(ticket.priority)">
                  {{ getPriorityLabel(ticket.priority) }}
                </mat-chip>
              </mat-chip-set>

              <div *ngIf="ticket.assignedToUser" class="assignee">
                <mat-icon>person</mat-icon>
                <span>{{ ticket.assignedToUser.name }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button [routerLink]="['/tickets', ticket.id]">
              <mat-icon>visibility</mat-icon>
              View
            </button>
            <button 
              mat-button 
              [routerLink]="['/tickets', ticket.id, 'edit']"
              *ngIf="canEditTicket(ticket)">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .filters mat-form-field {
      min-width: 200px;
    }

    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .description {
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.4;
    }

    .ticket-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }

    .assignee {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .assignee mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
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

      .tickets-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-direction: column;
      }

      .ticket-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  loading = true;
  statusFilter = '';
  priorityFilter = '';

  statusOptions = Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => ({
    value: parseInt(key),
    label
  }));

  priorityOptions = Object.entries(TICKET_PRIORITY_LABELS).map(([key, label]) => ({
    value: parseInt(key),
    label
  }));

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load tickets';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  applyFilters(): void {
    this.filteredTickets = this.tickets.filter(ticket => {
      const statusMatch = this.statusFilter === '' || ticket.status === this.statusFilter;
      const priorityMatch = this.priorityFilter === '' || ticket.priority === this.priorityFilter;
      return statusMatch && priorityMatch;
    });
  }

  canEditTicket(ticket: Ticket): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 1 || ticket.createdByUser.id === currentUser?.id;
  }

  getStatusLabel(status: TicketStatus): string {
    return TICKET_STATUS_LABELS[status];
  }

  getPriorityLabel(priority: TicketPriority): string {
    return TICKET_PRIORITY_LABELS[priority];
  }

  getStatusClass(status: TicketStatus): string {
    const statusMap: Record<TicketStatus, string> = {
      [TicketStatus.Open]: 'open',
      [TicketStatus.Pending]: 'pending',
      [TicketStatus.Resolved]: 'resolved',
      [TicketStatus.Closed]: 'closed'
    };
    return statusMap[status];
  }

  getPriorityClass(priority: TicketPriority): string {
    const priorityMap: Record<TicketPriority, string> = {
      [TicketPriority.Low]: 'low',
      [TicketPriority.Medium]: 'medium',
      [TicketPriority.High]: 'high'
    };
    return priorityMap[priority];
  }
}