import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isLoginMode ? 'Login' : 'Register' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email">
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
            </mat-form-field>
            
            <div class="error" *ngIf="errorMsg">{{ errorMsg }}</div>
            
            <button mat-raised-button color="primary" type="submit" [disabled]="authForm.invalid">
              {{ isLoginMode ? 'Login' : 'Register' }}
            </button>
          </form>
          <div class="toggle-mode">
            <button mat-button (click)="toggleMode()">
              {{ isLoginMode ? 'Need an account? Register' : 'Have an account? Login' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container { display: flex; justify-content: center; margin-top: 50px; }
    mat-card { width: 400px; }
    .full-width { width: 100%; margin-bottom: 15px; }
    .error { color: red; margin-bottom: 15px; }
    .toggle-mode { margin-top: 15px; text-align: center; }
  `]
})
export class LoginComponent {
  authForm: FormGroup;
  isLoginMode = true;
  errorMsg = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMsg = '';
  }

  onSubmit() {
    if (this.authForm.invalid) return;
    
    const obs = this.isLoginMode 
      ? this.authService.login(this.authForm.value)
      : this.authService.register(this.authForm.value);
      
    obs.subscribe({
      next: () => {
        if (!this.isLoginMode) {
          // If registered, switch to login mode and prefill
          this.isLoginMode = true;
          this.errorMsg = 'Registration successful! Please login.';
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'An error occurred';
      }
    });
  }
}
