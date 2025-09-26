import { User } from './auth.models';

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  assignedUsers: User[];
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  userIds: number[];
}

export interface UpdateProjectRequest {
  name: string;
  description: string;
  userIds: number[];
}

export interface AssignUsersToProjectRequest {
  userIds: number[];
}