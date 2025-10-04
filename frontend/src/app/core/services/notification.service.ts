import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface Notification {
  id: string;
  userId: string;
  ticketId: string | null;
  type: 'ticket_assigned' | 'ticket_updated' | 'ticket_commented' | 'project_assigned';
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.startPolling();
  }

  getNotifications(userId: string): Observable<Notification[]> {
    return from(
      this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []).map(n => ({
            id: n.id,
            userId: n.user_id,
            ticketId: n.ticket_id,
            type: n.type,
            message: n.message,
            isRead: n.is_read,
            createdAt: n.created_at
          }));
        })
    );
  }

  getUnreadCount(userId: string): Observable<number> {
    return from(
      this.supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .then(({ count, error }) => {
          if (error) throw error;
          return count || 0;
        })
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return from(
      this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  markAllAsRead(userId: string): Observable<void> {
    return from(
      this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  refreshUnreadCount(userId: string): void {
    this.getUnreadCount(userId).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: () => this.unreadCountSubject.next(0)
    });
  }

  private startPolling(): void {
    this.supabase.currentUser$.pipe(
      switchMap((user) => {
        if (!user) {
          this.unreadCountSubject.next(0);
          return [];
        }
        return interval(10000).pipe(
          startWith(0),
          switchMap(() => this.getUnreadCount(user.id))
        );
      })
    ).subscribe({
      next: (count) => {
        if (typeof count === 'number') {
          this.unreadCountSubject.next(count);
        }
      },
      error: () => this.unreadCountSubject.next(0)
    });
  }
}
