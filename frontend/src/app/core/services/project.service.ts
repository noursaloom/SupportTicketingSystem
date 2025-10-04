import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AssignUsersToProjectRequest {
  userIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private supabase: SupabaseService) {}

  getProjects(): Observable<Project[]> {
    return from(
      this.supabase.from('projects').select('*').then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          createdBy: p.created_by,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      })
    );
  }

  getProject(id: string): Observable<Project> {
    return from(
      this.supabase.from('projects').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Project not found');
        return {
          id: data.id,
          name: data.name,
          description: data.description,
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      })
    );
  }

  getUserProjects(userId: string): Observable<Project[]> {
    return from(
      (async () => {
        const { data: userProjects, error: upError } = await this.supabase
          .from('user_projects')
          .select('project_id')
          .eq('user_id', userId);

        if (upError) throw upError;

        if (!userProjects || userProjects.length === 0) {
          return [];
        }

        const projectIds = userProjects.map(up => up.project_id);

        const { data: projects, error: pError } = await this.supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (pError) throw pError;

        return (projects || []).map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          createdBy: p.created_by,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      })()
    );
  }

  createProject(request: CreateProjectRequest, createdBy: string): Observable<Project> {
    return from(
      this.supabase
        .from('projects')
        .insert({
          name: request.name,
          description: request.description,
          created_by: createdBy
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        })
    );
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<Project> {
    return from(
      this.supabase
        .from('projects')
        .update({
          ...(request.name && { name: request.name }),
          ...(request.description !== undefined && { description: request.description })
        })
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        })
    );
  }

  deleteProject(id: string): Observable<void> {
    return from(
      this.supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  assignUsersToProject(projectId: string, request: AssignUsersToProjectRequest): Observable<void> {
    return from(
      (async () => {
        const { error: deleteError } = await this.supabase
          .from('user_projects')
          .delete()
          .eq('project_id', projectId);

        if (deleteError) throw deleteError;

        if (request.userIds.length > 0) {
          const { error: insertError } = await this.supabase
            .from('user_projects')
            .insert(
              request.userIds.map(userId => ({
                user_id: userId,
                project_id: projectId
              }))
            );

          if (insertError) throw insertError;
        }
      })()
    );
  }

  getProjectUsers(projectId: string): Observable<string[]> {
    return from(
      this.supabase
        .from('user_projects')
        .select('user_id')
        .eq('project_id', projectId)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []).map(up => up.user_id);
        })
    );
  }
}
