import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="center-content">
      <mat-card class="form-container">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" required>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>
            
            <mat-progress-bar mode="indeterminate" *ngIf="loading"></mat-progress-bar>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="full-width" 
              [disabled]="loginForm.invalid || loading"
              style="margin-top: 1rem;">
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <p>Don't have an account? <a routerLink="/register">Sign up here</a></p>
        </mat-card-actions>
        
        <mat-card-footer>
          <div class="demo-accounts">
            <h4>Demo Accounts</h4>
            <p><strong>Admin:</strong> admin@demo.com / password</p>
            <p><strong>Ticket Applier:</strong> applier@demo.com / password</p>
            <p><strong>Ticket Receiver:</strong> receiver@demo.com / password</p>
            <p><strong>Legacy User:</strong> user@demo.com / password</p>
          </div>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .demo-accounts {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .demo-accounts h4 {
      margin-top: 0;
      color: #666;
    }
    
    .demo-accounts p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tickets']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const loginRequest: LoginRequest = this.loginForm.value;

      this.authService.login(loginRequest).subscribe({
        next: () => {
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/tickets']);
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.message || 'Login failed. Please try again.';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    }
  }
}