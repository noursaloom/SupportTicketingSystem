import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  projectName?: string;
  createdBy: string;
  createdByName?: string;
  assignedTo: string | null;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AssignTicketRequest {
  assignedTo: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName?: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AddCommentRequest {
  comment: string;
  isInternal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  constructor(private supabase: SupabaseService) {}

  getTickets(): Observable<Ticket[]> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .from('tickets')
          .select(`
            *,
            projects(name),
            creator:created_by(full_name),
            assignee:assigned_to(full_name)
          `);

        if (error) throw error;

        return (data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          projectId: t.project_id,
          projectName: t.projects?.name,
          createdBy: t.created_by,
          createdByName: t.creator?.full_name,
          assignedTo: t.assigned_to,
          assignedToName: t.assignee?.full_name,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          assignedAt: t.assigned_at
        }));
      })()
    );
  }

  getTicket(id: string): Observable<Ticket> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .from('tickets')
          .select(`
            *,
            projects(name),
            creator:created_by(full_name),
            assignee:assigned_to(full_name)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Ticket not found');

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          projectId: data.project_id,
          projectName: (data.projects as any)?.name,
          createdBy: data.created_by,
          createdByName: (data.creator as any)?.full_name,
          assignedTo: data.assigned_to,
          assignedToName: (data.assignee as any)?.full_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          assignedAt: data.assigned_at
        };
      })()
    );
  }

  createTicket(request: CreateTicketRequest, createdBy: string): Observable<Ticket> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .from('tickets')
          .insert({
            title: request.title,
            description: request.description,
            priority: request.priority,
            project_id: request.projectId,
            created_by: createdBy,
            status: 'open'
          })
          .select(`
            *,
            projects(name),
            creator:created_by(full_name)
          `)
          .single();

        if (error) throw error;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          projectId: data.project_id,
          projectName: (data.projects as any)?.name,
          createdBy: data.created_by,
          createdByName: (data.creator as any)?.full_name,
          assignedTo: data.assigned_to,
          assignedToName: undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          assignedAt: data.assigned_at
        };
      })()
    );
  }

  updateTicket(id: string, request: UpdateTicketRequest): Observable<Ticket> {
    return from(
      (async () => {
        const updateData: any = {};
        if (request.title !== undefined) updateData.title = request.title;
        if (request.description !== undefined) updateData.description = request.description;
        if (request.status !== undefined) updateData.status = request.status;
        if (request.priority !== undefined) updateData.priority = request.priority;

        const { data, error } = await this.supabase
          .from('tickets')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            projects(name),
            creator:created_by(full_name),
            assignee:assigned_to(full_name)
          `)
          .single();

        if (error) throw error;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          projectId: data.project_id,
          projectName: (data.projects as any)?.name,
          createdBy: data.created_by,
          createdByName: (data.creator as any)?.full_name,
          assignedTo: data.assigned_to,
          assignedToName: (data.assignee as any)?.full_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          assignedAt: data.assigned_at
        };
      })()
    );
  }

  deleteTicket(id: string): Observable<void> {
    return from(
      this.supabase
        .from('tickets')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  assignTicket(id: string, request: AssignTicketRequest): Observable<void> {
    return from(
      this.supabase.assignTicket(id, request.assignedTo)
    );
  }

  getTicketComments(ticketId: string): Observable<TicketComment[]> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .from('ticket_comments')
          .select(`
            *,
            users(full_name)
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map((c: any) => ({
          id: c.id,
          ticketId: c.ticket_id,
          userId: c.user_id,
          userName: c.users?.full_name,
          comment: c.comment,
          isInternal: c.is_internal,
          createdAt: c.created_at
        }));
      })()
    );
  }

  addComment(ticketId: string, userId: string, request: AddCommentRequest): Observable<TicketComment> {
    return from(
      (async () => {
        const { data, error } = await this.supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            comment: request.comment,
            is_internal: request.isInternal
          })
          .select(`
            *,
            users(full_name)
          `)
          .single();

        if (error) throw error;

        return {
          id: data.id,
          ticketId: data.ticket_id,
          userId: data.user_id,
          userName: (data.users as any)?.full_name,
          comment: data.comment,
          isInternal: data.is_internal,
          createdAt: data.created_at
        };
      })()
    );
  }
}
