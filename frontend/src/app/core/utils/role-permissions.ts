export type UserRole = 'applier' | 'receiver' | 'manager';

export class RolePermissions {
  static canCreateTickets(role: UserRole): boolean {
    return role === 'applier' || role === 'manager';
  }

  static canEditTicket(role: UserRole, ticket: { createdBy: string; assignedTo: string | null }, userId: string): boolean {
    if (role === 'manager') return true;
    if (role === 'applier' && ticket.createdBy === userId && ticket.assignedTo === null) return true;
    if (role === 'receiver' && ticket.assignedTo === userId) return true;
    return false;
  }

  static canDeleteTickets(role: UserRole): boolean {
    return role === 'manager';
  }

  static canAssignTickets(role: UserRole): boolean {
    return role === 'manager';
  }

  static canViewAssignmentSection(role: UserRole): boolean {
    return role === 'manager';
  }

  static canManageProjects(role: UserRole): boolean {
    return role === 'manager';
  }

  static canManageUsers(role: UserRole): boolean {
    return role === 'manager';
  }

  static canViewAllTickets(role: UserRole): boolean {
    return role === 'manager';
  }

  static canAddInternalComments(role: UserRole): boolean {
    return role === 'receiver' || role === 'manager';
  }

  static canViewInternalComments(role: UserRole): boolean {
    return role === 'receiver' || role === 'manager';
  }
}
