# Component Migration Guide

This document provides detailed instructions for updating all remaining components to work with the new Supabase backend.

## Common Changes Across All Components

### 1. Import Updates

**Old:**
```typescript
import { User, UserRole } from '../../core/models/auth.models';
import { Project } from '../../core/models/project.models';
import { Ticket } from '../../core/models/ticket.models';
```

**New:**
```typescript
import { AuthService, AppUser } from '../../core/services/auth.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { TicketService, Ticket } from '../../core/services/ticket.service';
```

### 2. ID Type Changes
- All IDs changed from `number` to `string` (UUIDs)
- Update all method calls, parameters, and variables accordingly

### 3. Role Enum Changes
- `UserRole.Admin` → `'manager'`
- `UserRole.TicketReceiver` → `'receiver'`
- `UserRole.TicketApplier` → `'applier'`

## Component-Specific Updates

### 1. Login Component (`auth/login/login.component.ts`)

**Changes:**
- Import `LoginRequest` from auth.service instead of models
- Update to use new `AppUser` type
- Remove HTTP error handling specific to old backend

**Example:**
```typescript
import { AuthService, LoginRequest, AppUser } from '../../core/services/auth.service';

// In component
onSubmit(): void {
  if (this.loginForm.valid) {
    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (user: AppUser) => {
        this.router.navigate(['/tickets']);
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 5000 });
      }
    });
  }
}
```

### 2. User Management Component (`admin/user-management/user-management.component.ts`)

**Key Changes:**
- Change `User` type to `AppUser`
- Update `id` from `number` to `string`
- Import from services instead of models
- Update role references

**Example:**
```typescript
import { AuthService, AppUser, CreateUserRequest, UpdateUserRequest } from '../../core/services/auth.service';

export class UserManagementComponent {
  users: AppUser[] = [];

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      }
    });
  }

  deleteUser(userId: string): void {  // Changed from number to string
    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers();
      }
    });
  }

  getCurrentUserId(): string | null {  // Changed return type
    return this.authService.getCurrentUser()?.id || null;
  }
}
```

### 3. Project Management Component (`admin/project-management/project-management.component.ts`)

**Key Changes:**
- Import `Project` from project.service
- Change IDs to string
- Update deleteProject call
- Pass `createdBy` parameter when creating projects

**Example:**
```typescript
import { ProjectService, Project, CreateProjectRequest } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';

export class ProjectManagementComponent {
  projects: Project[] = [];

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
      }
    });
  }

  createProject(request: CreateProjectRequest): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;

    this.projectService.createProject(request, userId).subscribe({
      next: () => {
        this.loadProjects();
      }
    });
  }

  deleteProject(projectId: string): void {  // Changed from number
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.loadProjects();
      }
    });
  }
}
```

### 4. Ticket List Component (`tickets/ticket-list/ticket-list.component.ts`)

**Key Changes:**
- Import types from ticket.service
- Add role-based filtering
- Hide create button for receivers
- Update to use new Ticket interface

**Example:**
```typescript
import { TicketService, Ticket } from '../../core/services/ticket.service';
import { AuthService, AppUser } from '../../core/services/auth.service';
import { RolePermissions } from '../../core/utils/role-permissions';

export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  currentUser: AppUser | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadTickets();
  }

  get canCreateTickets(): boolean {
    return this.currentUser?.role
      ? RolePermissions.canCreateTickets(this.currentUser.role)
      : false;
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
      }
    });
  }
}

// In template:
// <button mat-raised-button *ngIf="canCreateTickets" routerLink="/tickets/create">
```

### 5. Ticket Form Component (`tickets/ticket-form/ticket-form.component.ts`)

**Key Changes:**
- Load only assigned projects for appliers
- Add attachment upload support
- Pass `createdBy` parameter
- Update to use string IDs

**Example:**
```typescript
import { TicketService, CreateTicketRequest } from '../../core/services/ticket.service';
import { ProjectService, Project } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';

export class TicketFormComponent implements OnInit {
  availableProjects: Project[] = [];
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (user.role === 'manager') {
      this.projectService.getProjects().subscribe({
        next: (projects) => {
          this.availableProjects = projects;
        }
      });
    } else if (user.role === 'applier') {
      this.projectService.getUserProjects(user.id).subscribe({
        next: (projects) => {
          this.availableProjects = projects;
        }
      });
    }
  }

  onSubmit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const request: CreateTicketRequest = {
      title: this.form.value.title,
      description: this.form.value.description,
      priority: this.form.value.priority,
      projectId: this.form.value.projectId
    };

    this.ticketService.createTicket(request, user.id).subscribe({
      next: () => {
        this.router.navigate(['/tickets']);
      }
    });
  }
}
```

### 6. Ticket Detail Component (`tickets/ticket-detail/ticket-detail.component.ts`)

**Key Changes:**
- Hide assignment section for receivers
- Show only receivers from same project in assignment dropdown
- Use edge function for assignment
- Support comments with internal flag
- Role-based edit permissions

**Example:**
```typescript
import { TicketService, Ticket, UpdateTicketRequest, AssignTicketRequest } from '../../core/services/ticket.service';
import { AuthService, AppUser } from '../../core/services/auth.service';
import { RolePermissions } from '../../core/utils/role-permissions';

export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  currentUser: AppUser | null = null;
  availableReceivers: AppUser[] = [];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadTicket();
  }

  get canEdit(): boolean {
    if (!this.currentUser || !this.ticket) return false;
    return RolePermissions.canEditTicket(
      this.currentUser.role,
      { createdBy: this.ticket.createdBy, assignedTo: this.ticket.assignedTo },
      this.currentUser.id
    );
  }

  get showAssignmentSection(): boolean {
    return this.currentUser?.role === 'manager';
  }

  assignTicket(receiverId: string): void {
    if (!this.ticket) return;

    const request: AssignTicketRequest = { assignedTo: receiverId };
    this.ticketService.assignTicket(this.ticket.id, request).subscribe({
      next: () => {
        this.loadTicket();
        this.snackBar.open('Ticket assigned successfully', 'Close', { duration: 3000 });
      }
    });
  }
}

// In template:
// <div *ngIf="showAssignmentSection">
//   <!-- Assignment UI -->
// </div>
```

### 7. Notification Center Component (`notifications/notification-center/notification-center.component.ts`)

**Key Changes:**
- Pass user ID to service methods
- Update notification interface

**Example:**
```typescript
import { NotificationService, Notification } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

export class NotificationCenterComponent implements OnInit {
  notifications: Notification[] = [];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.notificationService.getNotifications(user.id).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      }
    });
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        if (user) {
          this.notificationService.refreshUnreadCount(user.id);
        }
        this.loadNotifications();
      }
    });
  }
}
```

## File Attachment Support

### Create Attachment Service

```typescript
// src/app/core/services/attachment.service.ts
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  constructor(private supabase: SupabaseService) {}

  uploadAttachment(ticketId: string, file: File, userId: string): Observable<TicketAttachment> {
    return from(
      (async () => {
        const filePath = `${ticketId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await this.supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data, error: dbError } = await this.supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: userId
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return {
          id: data.id,
          ticketId: data.ticket_id,
          fileName: data.file_name,
          filePath: data.file_path,
          fileSize: data.file_size,
          mimeType: data.mime_type,
          uploadedBy: data.uploaded_by,
          uploadedAt: data.uploaded_at
        };
      })()
    );
  }

  getAttachments(ticketId: string): Observable<TicketAttachment[]> {
    return from(
      this.supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []).map(a => ({
            id: a.id,
            ticketId: a.ticket_id,
            fileName: a.file_name,
            filePath: a.file_path,
            fileSize: a.file_size,
            mimeType: a.mime_type,
            uploadedBy: a.uploaded_by,
            uploadedAt: a.uploaded_at
          }));
        })
    );
  }

  getDownloadUrl(filePath: string): Observable<string> {
    return from(
      this.supabase.storage
        .from('ticket-attachments')
        .createSignedUrl(filePath, 3600)
        .then(({ data, error }) => {
          if (error) throw error;
          return data.signedUrl;
        })
    );
  }
}
```

## Summary of All Changes

1. ✅ All IDs: `number` → `string` (UUIDs)
2. ✅ User type: `User` → `AppUser`
3. ✅ Role enum: `UserRole.X` → `'applier' | 'receiver' | 'manager'`
4. ✅ Import sources: models → services
5. ✅ Add `createdBy` parameter to create methods
6. ✅ Use `RolePermissions` utility for permission checks
7. ✅ Implement role-based UI visibility
8. ✅ Hide assignment section for receivers
9. ✅ Filter projects for appliers (only assigned)
10. ✅ Filter receivers for assignment (only from same project)

## Next Steps

After updating all components:
1. Run `npm run build` to check for errors
2. Test each role thoroughly
3. Verify RLS policies work correctly
4. Test file upload functionality
