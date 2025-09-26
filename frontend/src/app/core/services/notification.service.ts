import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, MarkNotificationReadRequest } from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll for unread count every 30 seconds
    this.startPolling();
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${environment.apiUrl}/notifications/unread-count`);
  }

  markAsRead(notificationId: number): Observable<Notification> {
    const request: MarkNotificationReadRequest = { isRead: true };
    return this.http.put<Notification>(`${environment.apiUrl}/notifications/${notificationId}/read`, request);
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: () => this.unreadCountSubject.next(0)
    });
  }

  private startPolling(): void {
    // Poll every 30 seconds, starting immediately
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    ).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
      error: () => this.unreadCountSubject.next(0)
    });
  }
}