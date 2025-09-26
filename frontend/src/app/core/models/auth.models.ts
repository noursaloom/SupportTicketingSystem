export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  roleDisplayName:string;
}

export enum UserRole {
  TicketApplier = 0,
  TicketReceiver = 1,
  Admin = 2
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.TicketApplier]: 'Ticket Applier',
  [UserRole.TicketReceiver]: 'Ticket Receiver',
  [UserRole.Admin]: 'Admin'
}