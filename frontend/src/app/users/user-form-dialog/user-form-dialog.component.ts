import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../core/services/auth.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest, USER_ROLE_LABELS } from '../../core/models/auth.models';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit User' : 'Create New User' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <mat-form-field class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="userForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" required>
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">
            Please enter a valid email
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width" *ngIf="!isEditMode">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" required>
          <mat-error *ngIf="userForm.get('password')?.hasError('required')">
            Password is required
          </mat-error>
          <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
            Password must be at least 6 characters
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option [value]="UserRole.TicketApplier">{{ USER_ROLE_LABELS[UserRole.TicketApplier] }}</mat-option>
            <mat-option [value]="UserRole.TicketReceiver">{{ USER_ROLE_LABELS[UserRole.TicketReceiver] }}</mat-option>
            <mat-option [value]="UserRole.Admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">
        Cancel
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()" 
        [disabled]="userForm.invalid || loading">
        {{ loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      margin-bottom: 1rem;
    }
  `]
})
export class UserFormDialogComponent {
  userForm: FormGroup;
  loading = false;
  isEditMode = false;
  UserRole = UserRole;
  USER_ROLE_LABELS = USER_ROLE_LABELS;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    this.isEditMode = !!data;
    
    this.userForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email]],
      role: [data?.role ?? UserRole.TicketApplier, Validators.required]
    });

    // Add password field for create mode only
    if (!this.isEditMode) {
      this.userForm.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(6)]));
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;

      if (this.isEditMode && this.data) {
        const updateRequest: UpdateUserRequest = {
          name: this.userForm.value.name,
          email: this.userForm.value.email,
          role: this.userForm.value.role
        };

        this.authService.updateUser(this.data.id, updateRequest).subscribe({
          next: () => {
            this.snackBar.open('User updated successfully!', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to update user';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      } else {
        const createRequest: CreateUserRequest = this.userForm.value;

        this.authService.createUser(createRequest).subscribe({
          next: () => {
            this.snackBar.open('User created successfully!', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to create user';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}