import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: 'applier' | 'receiver' | 'manager';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'applier' | 'receiver' | 'manager';
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'applier' | 'receiver' | 'manager';
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: 'applier' | 'receiver' | 'manager';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.supabase.currentUser$.subscribe(async (user) => {
      if (user) {
        try {
          const profile = await this.supabase.getUserProfile(user.id);
          if (profile) {
            this.currentUserSubject.next({
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              role: profile.role,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          this.currentUserSubject.next(null);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  register(request: RegisterRequest): Observable<AppUser> {
    return from(
      (async () => {
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
          email: request.email,
          password: request.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        const { data: userData, error: userError } = await this.supabase.from('users').insert({
          id: authData.user.id,
          email: request.email,
          full_name: request.fullName,
          role: request.role,
        }).select().single();

        if (userError) throw userError;

        return {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          role: userData.role,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at
        };
      })()
    );
  }

  login(request: LoginRequest): Observable<AppUser> {
    return from(
      (async () => {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: request.email,
          password: request.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Login failed');

        const profile = await this.supabase.getUserProfile(data.user.id);
        if (!profile) throw new Error('User profile not found');

        const appUser: AppUser = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };

        this.currentUserSubject.next(appUser);
        return appUser;
      })()
    );
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'manager';
  }

  isReceiver(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'receiver';
  }

  isApplier(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'applier';
  }

  isManagerOrReceiver(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'manager' || user?.role === 'receiver';
  }

  isAdmin(): boolean {
    return this.isManager();
  }

  async getToken(): Promise<string | null> {
    const session = await this.supabase.auth.getSession();
    return session.data.session?.access_token || null;
  }

  getUsers(): Observable<AppUser[]> {
    return from(
      this.supabase.from('users').select('*').then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(u => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          createdAt: u.created_at,
          updatedAt: u.updated_at
        }));
      })
    );
  }

  createUser(request: CreateUserRequest): Observable<AppUser> {
    return from(
      (async () => {
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
          email: request.email,
          password: request.password,
          email_confirm: true,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        const { data: userData, error: userError } = await this.supabase.from('users').insert({
          id: authData.user.id,
          email: request.email,
          full_name: request.fullName,
          role: request.role,
        }).select().single();

        if (userError) throw userError;

        return {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          role: userData.role,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at
        };
      })()
    );
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<AppUser> {
    return from(
      (async () => {
        const updateData: any = {};
        if (request.fullName !== undefined) updateData.full_name = request.fullName;
        if (request.role !== undefined) updateData.role = request.role;

        const { data, error } = await this.supabase
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      })()
    );
  }

  deleteUser(id: string): Observable<void> {
    return from(
      (async () => {
        const { error: userError } = await this.supabase
          .from('users')
          .delete()
          .eq('id', id);

        if (userError) throw userError;

        const { error: authError } = await this.supabase.auth.admin.deleteUser(id);
        if (authError) throw authError;
      })()
    );
  }
}
