import { Ticket } from './ticket.models';

export interface Notification {
  id: number;
  userId: number;
  ticketId: number;
  type: NotificationType;
  message: string;
  ticketTitle?: string;
  projectName?: string;
  creatorName?: string;
  descriptionSummary?: string;
  isRead: boolean;
  createdAt: Date;
  ticket: Ticket;
  typeDisplayName: string;
}

export enum NotificationType {
  TicketCreated = 0,
  TicketAssigned = 1,
  TicketStatusChanged = 2,
  TicketUpdated = 3
}

export interface MarkNotificationReadRequest {
  isRead: boolean;
}