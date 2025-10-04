import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ProjectService, Project, CreateProjectRequest, UpdateProjectRequest } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { AppUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit Project' : 'Create New Project' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
        <mat-form-field class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">
            Project name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Description</mat-label>
          <textarea 
            matInput 
            formControlName="description" 
            rows="3" 
            required>
          </textarea>
          <mat-error *ngIf="projectForm.get('description')?.hasError('required')">
            Description is required
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Assign Users</mat-label>
          <mat-select formControlName="userIds" multiple>
            <mat-option *ngFor="let user of availableUsers" [value]="user.id">
              {{ user.fullName }} ({{ user.email }}) - {{ getRoleDisplayName(user.role) }}
            </mat-option>
          </mat-select>
          <mat-hint>Select users to assign to this project</mat-hint>
        </mat-form-field>

        <div class="selected-users" *ngIf="selectedUsers.length > 0">
          <label>Selected Users:</label>
          <mat-chip-set>
            <mat-chip *ngFor="let user of selectedUsers" class="selected-user-chip">
              {{ user.fullName }}
            </mat-chip>
          </mat-chip-set>
        </div>

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
        [disabled]="projectForm.invalid || loading">
        {{ loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      margin-bottom: 1rem;
    }

    .selected-users {
      margin-bottom: 1rem;
    }

    .selected-users label {
      display: block;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .selected-user-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }
  `]
})
export class ProjectFormDialogComponent implements OnInit {
  projectForm: FormGroup;
  loading = false;
  isEditMode = false;
  availableUsers: AppUser[] = [];
  selectedUsers: AppUser[] = [];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProjectFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Project | null
  ) {
    this.isEditMode = !!data;
    
    this.projectForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || '', Validators.required],
      userIds: [[]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    
    // Watch for changes in user selection
    this.projectForm.get('userIds')?.valueChanges.subscribe(userIds => {
      this.updateSelectedUsers(userIds);
    });

    // Initialize selected users if in edit mode
    if (this.isEditMode && this.data) {
      this.updateSelectedUsers(this.data.assignedUsers.map(u => u.id));
    }
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.availableUsers = users;
        // Update selected users display after users are loaded
        if (this.isEditMode && this.data) {
          this.updateSelectedUsers(this.data.assignedUsers.map(u => u.id));
        }
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to load users';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  updateSelectedUsers(userIds: number[]): void {
    this.selectedUsers = this.availableUsers.filter(user => userIds.includes(user.id));
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.loading = true;

      if (this.isEditMode && this.data) {
        const updateRequest: UpdateProjectRequest = this.projectForm.value;

        this.projectService.updateProject(this.data.id, updateRequest).subscribe({
          next: () => {
            this.snackBar.open('Project updated successfully!', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to update project';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      } else {
        const createRequest: CreateProjectRequest = this.projectForm.value;
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
          this.loading = false;
          return;
        }

        this.projectService.createProject(createRequest, currentUser.id).subscribe({
          next: () => {
            this.snackBar.open('Project created successfully!', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            const message = error.error?.message || 'Failed to create project';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'manager':
        return 'Manager';
      case 'receiver':
        return 'Receiver';
      case 'applier':
        return 'Applier';
      default:
        return role;
    }
  }
}