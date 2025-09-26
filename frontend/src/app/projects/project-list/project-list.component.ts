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

import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-list',
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
    MatTooltipModule
  ],
  template: `
    <div class="container" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <div class="header">
        <h1>Project Management</h1>
        <button mat-raised-button color="primary" (click)="openCreateProjectDialog()">
          <mat-icon>add</mat-icon>
          Create Project
        </button>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <mat-card *ngIf="!loading">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="projects" class="projects-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let project">
                  <div class="project-name">
                    <strong>{{ project.name }}</strong>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let project">
                  <div class="project-description">
                    {{ project.description | slice:0:100 }}{{ project.description.length > 100 ? '...' : '' }}
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="assignedUsers">
                <th mat-header-cell *matHeaderCellDef>Assigned Users</th>
                <td mat-cell *matCellDef="let project">
                  <div class="assigned-users">
                    <mat-chip-set *ngIf="project.assignedUsers.length > 0">
                      <mat-chip 
                        *ngFor="let user of project.assignedUsers | slice:0:3" 
                        class="user-chip"
                        [matTooltip]="user.email">
                        {{ user.name }}
                      </mat-chip>
                      <mat-chip 
                        *ngIf="project.assignedUsers.length > 3"
                        class="more-users-chip"
                        [matTooltip]="getMoreUsersTooltip(project.assignedUsers)">
                        +{{ project.assignedUsers.length - 3 }} more
                      </mat-chip>
                    </mat-chip-set>
                    <span *ngIf="project.assignedUsers.length === 0" class="no-users">
                      No users assigned
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let project">{{ project.createdAt | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let project">
                  <button 
                    mat-icon-button 
                    color="primary" 
                    (click)="openEditProjectDialog(project)"
                    matTooltip="Edit Project">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="confirmDeleteProject(project)"
                    matTooltip="Delete Project">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <div *ngIf="projects.length === 0" class="no-projects">
            <mat-icon style="font-size: 48px; opacity: 0.3;">folder</mat-icon>
            <h3>No projects found</h3>
            <p>Create the first project to get started.</p>
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

    .projects-table {
      width: 100%;
    }

    .project-name {
      font-weight: 500;
    }

    .project-description {
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.4;
    }

    .assigned-users {
      min-height: 32px;
      display: flex;
      align-items: center;
    }

    .user-chip {
      background-color: #e3f2fd;
      color: #1976d2;
      margin-right: 0.25rem;
    }

    .more-users-chip {
      background-color: #f5f5f5;
      color: #666;
    }

    .no-users {
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
      font-size: 0.875rem;
    }

    .no-projects {
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

      .projects-table {
        font-size: 0.875rem;
      }

      .assigned-users mat-chip-set {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  displayedColumns: string[] = ['name', 'description', 'assignedUsers', 'createdAt', 'actions'];

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to load projects';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  openCreateProjectDialog(): void {
    const dialogRef = this.dialog.open(ProjectFormDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  openEditProjectDialog(project: Project): void {
    const dialogRef = this.dialog.open(ProjectFormDialogComponent, {
      width: '600px',
      data: project
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  confirmDeleteProject(project: Project): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteProject(project.id);
      }
    });
  }

  deleteProject(projectId: number): void {
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.snackBar.open('Project deleted successfully!', 'Close', { duration: 3000 });
        this.loadProjects();
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to delete project';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  getMoreUsersTooltip(users: any[]): string {
    const remainingUsers = users.slice(3);
    return remainingUsers.map(user => `${user.name} (${user.email})`).join('\n');
  }
}