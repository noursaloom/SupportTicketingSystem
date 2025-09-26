import { User } from './auth.models';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  createdByUser: User;
  assignedToUser?: User;
}

export enum TicketPriority {
  Low = 0,
  Medium = 1,
  High = 2
}

export enum TicketStatus {
  Open = 0,
  Pending = 1,
  Resolved = 2,
  Closed = 3
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
}

export interface AssignTicketRequest {
  userId: number;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.Pending]: 'Pending',
  [TicketStatus.Resolved]: 'Resolved',
  [TicketStatus.Closed]: 'Closed'
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.Low]: 'Low',
  [TicketPriority.Medium]: 'Medium',
  [TicketPriority.High]: 'High'
};