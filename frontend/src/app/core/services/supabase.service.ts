import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'applier' | 'receiver' | 'manager';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          priority: 'low' | 'medium' | 'high' | 'critical';
          project_id: string;
          created_by: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          assigned_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'updated_at' | 'assigned_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      user_projects: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_projects']['Row'], 'id' | 'assigned_at'>;
        Update: Partial<Database['public']['Tables']['user_projects']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          ticket_id: string | null;
          type: 'ticket_assigned' | 'ticket_updated' | 'ticket_commented' | 'project_assigned';
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      ticket_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_attachments']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['ticket_attachments']['Insert']>;
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          comment: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_comments']['Insert']>;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        this.currentUserSubject.next(session?.user ?? null);
      })();
    });

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  get client() {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get from() {
    return this.supabase.from.bind(this.supabase);
  }

  get storage() {
    return this.supabase.storage;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async assignTicket(ticketId: string, assignedTo: string) {
    const session = await this.supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${environment.supabaseUrl}/functions/v1/assign-ticket`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId, assignedTo }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign ticket');
    }

    return response.json();
  }
}
