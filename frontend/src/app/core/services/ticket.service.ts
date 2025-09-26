import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Ticket, 
  CreateTicketRequest, 
  UpdateTicketRequest, 
  AssignTicketRequest 
} from '../models/ticket.models';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${environment.apiUrl}/tickets`);
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${environment.apiUrl}/tickets/${id}`);
  }

  createTicket(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${environment.apiUrl}/tickets`, request);
  }

  updateTicket(id: number, request: UpdateTicketRequest): Observable<Ticket> {
    return this.http.put<Ticket>(`${environment.apiUrl}/tickets/${id}`, request);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tickets/${id}`);
  }

  assignTicket(id: number, request: AssignTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${environment.apiUrl}/tickets/${id}/assign`, request);
  }
}