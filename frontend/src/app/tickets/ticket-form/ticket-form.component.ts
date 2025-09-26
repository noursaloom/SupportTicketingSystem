import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  Ticket, 
  CreateTicketRequest, 
  UpdateTicketRequest, 
  TicketPriority, 
  TicketStatus,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS
} from '../../core/models/ticket.models';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <div class="header">
        <button mat-icon-button (click)="goBack()" style="margin-right: 1rem;">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode ? 'Edit Ticket' : 'Create New Ticket' }}</h1>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" required>
              <mat-error *ngIf="ticketForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Description</mat-label>
              <textarea 
                matInput 
                formControlName="description" 
                rows="4" 
                required>
              </textarea>
              <mat-error *ngIf="ticketForm.get('description')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                <mat-option *ngFor="let priority of priorityOptions" [value]="priority.value">
                  {{ priority.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="full-width" *ngIf="isEditMode">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  {{ status.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

            <div class="form-actions">
              <button 
                mat-button 
                type="button" 
                (click)="goBack()" 
                [disabled]="loading">
                Cancel
              </button>
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="ticketForm.invalid || loading">
                {{ loading ? 'Saving...' : (isEditMode ? 'Update Ticket' : 'Create Ticket') }}
              </button>
            </div>
          </form>
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class TicketFormComponent implements OnInit {
  ticketForm: FormGroup;
  loading = false;
  isEditMode = false;
  ticketId?: number;
  currentTicket?: Ticket;

  priorityOptions = Object.entries(TICKET_PRIORITY_LABELS).map(([key, label]) => ({
    value: parseInt(key),
    label
  }));

  statusOptions = Object.entries(TICKET_STATUS_LABELS).map(([key, label]) => ({
    value: parseInt(key),
    label
  }));

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: [TicketPriority.Low, Validators.required],
      status: [TicketStatus.Open]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.ticketId = +params['id'];
        this.loadTicket();
      }
    });
  }

  loadTicket(): void {
    if (!this.ticketId) return;

    this.loading = true;
    this.ticketService.getTicket(this.ticketId).subscribe({
      next: (ticket) => {
        this.currentTicket = ticket;
        this.ticketForm.patchValue({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status
        });
        this.loading = false;

        // Check if user can edit this ticket
        if (!this.canEditTicket(ticket)) {
          this.snackBar.open('You do not have permission to edit this ticket', 'Close', { duration: 5000 });
          this.router.navigate(['/tickets', ticket.id]);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load ticket';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        this.router.navigate(['/tickets']);
      }
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      this.loading = true;

      if (this.isEditMode && this.ticketId) {
        const updateRequest: UpdateTicketRequest = {
          title: this.ticketForm.value.title,
          description: this.ticketForm.value.description,
          priority: Number(this.ticketForm.value.priority),
          status: Number(this.ticketForm.value.status)
        };
        this.ticketService.updateTicket(this.ticketId, updateRequest).subscribe({
          next: (ticket) => {
            this.snackBar.open('Ticket updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/tickets', ticket.id]);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to update ticket';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      } else {
        const createRequest: CreateTicketRequest = {
          title: this.ticketForm.value.title,
          description: this.ticketForm.value.description,
          priority: Number(this.ticketForm.value.priority)
        };

        this.ticketService.createTicket(createRequest).subscribe({
          next: (ticket) => {
            this.snackBar.open('Ticket created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/tickets', ticket.id]);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to create ticket';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  canEditTicket(ticket: Ticket): boolean {
    const currentUser = this.authService.getCurrentUser();
    return this.authService.isAdminOrReceiver() || ticket.createdByUser.id === currentUser?.id;
  }

  goBack(): void {
    if (this.isEditMode && this.ticketId) {
      this.router.navigate(['/tickets', this.ticketId]);
    } else {
      this.router.navigate(['/tickets']);
    }
  }
}