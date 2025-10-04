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

import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService, AppUser } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ProjectFormDialogComponent } from '../../projects/project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-management',
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
            Project Management
          </h1>
          <p class="subtitle">Manage projects and user assignments</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateProjectDialog()">
          <mat-icon>add</mat-icon>
          Create Project
        </button>
      </div>

      <div class="stats-cards" *ngIf="!loading">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon projects">folder</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ projects.length }}</div>
                <div class="stat-label">Total Projects</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon active">check_circle</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getActiveProjects() }}</div>
                <div class="stat-label">Active Projects</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon users">people</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getTotalAssignedUsers() }}</div>
                <div class="stat-label">Assigned Users</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon avg">trending_up</mat-icon>
              <div class="stat-info">
                <div class="stat-number">{{ getAverageUsersPerProject() }}</div>
                <div class="stat-label">Avg Users/Project</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <mat-card *ngIf="!loading" class="projects-table-card">
        <mat-card-header>
          <mat-card-title>All Projects</mat-card-title>
          <mat-card-subtitle>Manage project details and user assignments</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="projects" class="projects-table" matSort>
              <ng-container matColumnDef="icon">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let project">
                  <div class="project-icon">
                    <mat-icon>folder</mat-icon>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Project</th>
                <td mat-cell *matCellDef="let project">
                  <div class="project-info">
                    <div class="project-name">{{ project.name }}</div>
                    <div class="project-description">
                      {{ project.description | slice:0:80 }}{{ project.description.length > 80 ? '...' : '' }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="assignedUsers">
                <th mat-header-cell *matHeaderCellDef>Assigned Users</th>
                <td mat-cell *matCellDef="let project">
                  <div class="assigned-users">
                    <div class="user-count">
                      <mat-icon>people</mat-icon>
                      {{ project.assignedUsers?.length || 0 }} users
                    </div>
                    <div class="user-chips" *ngIf="project.assignedUsers && project.assignedUsers.length > 0">
                      <mat-chip 
                        *ngFor="let user of project.assignedUsers.slice(0, 3)" 
                        class="user-chip"
                        [matTooltip]="user.email">
                        <mat-icon>{{ getUserRoleIcon(user.role) }}</mat-icon>
                        {{ user.name }}
                      </mat-chip>
                      <mat-chip 
                        *ngIf="project.assignedUsers.length > 3"
                        class="more-users-chip"
                        [matTooltip]="getMoreUsersTooltip(project.assignedUsers)">
                        +{{ project.assignedUsers.length - 3 }} more
                      </mat-chip>
                    </div>
                    <span *ngIf="!project.assignedUsers || project.assignedUsers.length === 0" class="no-users">
                      No users assigned
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
                <td mat-cell *matCellDef="let project">
                  <div class="date-info">
                    <div class="date">{{ project.createdAt | date:'mediumDate' }}</div>
                    <div class="time">{{ project.createdAt | date:'shortTime' }}</div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let project">
                  <mat-chip class="status-active">
                    <mat-icon>check_circle</mat-icon>
                    Active
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let project">
                  <div class="action-buttons">
                    <button 
                      mat-icon-button 
                      color="primary" 
                      (click)="openEditProjectDialog(project)"
                      matTooltip="Edit Project">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button 
                      mat-icon-button 
                      color="accent" 
                      (click)="openEditProjectDialog(project)"
                      matTooltip="Manage Users">
                      <mat-icon>people</mat-icon>
                    </button>
                    <button 
                      mat-icon-button 
                      color="warn" 
                      (click)="confirmDeleteProject(project)"
                      matTooltip="Delete Project">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="project-row"></tr>
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

    .stat-icon.projects { color: #2196f3; }
    .stat-icon.active { color: #4caf50; }
    .stat-icon.users { color: #ff9800; }
    .stat-icon.avg { color: #9c27b0; }

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

    .projects-table-card {
      margin-top: 1rem;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .projects-table {
      width: 100%;
    }

    .project-row:hover {
      background-color: #f5f5f5;
    }

    .project-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #2196f3;
    }

    .project-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .project-name {
      font-weight: 500;
      color: #333;
    }

    .project-description {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    .assigned-users {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.7);
    }

    .user-count mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .user-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .user-chip {
      background-color: #e3f2fd;
      color: #1976d2;
      font-size: 0.75rem;
      height: 24px;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .user-chip mat-icon {
      font-size: 0.875rem;
      width: 0.875rem;
      height: 0.875rem;
    }

    .more-users-chip {
      background-color: #f5f5f5;
      color: #666;
      font-size: 0.75rem;
      height: 24px;
    }

    .no-users {
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
      font-size: 0.875rem;
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

      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .projects-table {
        font-size: 0.875rem;
      }

      .user-chips {
        flex-direction: column;
      }
    }
  `]
})
export class ProjectManagementComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  displayedColumns: string[] = ['icon', 'name', 'assignedUsers', 'createdAt', 'status', 'actions'];

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
      next: (projects: Project[]) => { 
        this.projects = projects.map(p => ({
          ...p,
          assignedUsers: p.assignedUsers || []
        }));
        this.loading = false;
      },
      error: (err: any) => { 
        this.loading = false;
        const message = err.error?.message || 'Failed to load projects';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  getActiveProjects(): number {
    return this.projects.length; // All projects are considered active for now
  }

  getTotalAssignedUsers(): number {
    return this.projects.reduce((total, project) => 
      total + (project.assignedUsers?.length || 0), 0);
  }

  getAverageUsersPerProject(): string {
    if (this.projects.length === 0) return '0';
    const avg = this.getTotalAssignedUsers() / this.projects.length;
    return avg.toFixed(1);
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

  deleteProject(projectId: string): void {
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

  getUserRoleIcon(role: number): string {
    switch (role) {
      case 0: return 'person'; // TicketApplier
      case 1: return 'support_agent'; // TicketReceiver
      case 2: return 'admin_panel_settings'; // Admin
      default: return 'person';
    }
  }

  getMoreUsersTooltip(users: User[]): string {
    const remainingUsers = users.slice(3);
    return remainingUsers.map(user => `${user.name} (${user.email})`).join('\n');
  }
}