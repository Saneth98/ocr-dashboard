import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <div class="logo">
          <div class="logo-icon">SO</div>
          <h2>SMART OCR</h2>
        </div>
        
        <h3>Join Mission Control</h3>
        <p class="subtitle">Create your developer account</p>

        <form (submit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="user@smartocr.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
          </div>
          
          <div *ngIf="error()" class="error-message">
            {{ error() }}
          </div>

          <button type="submit" [disabled]="loading()" class="btn-primary">
            {{ loading() ? 'Creating Account...' : 'Register Now' }}
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login">Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'sass:color';
    @use '../../../../styles/variables.scss' as *;
    
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: $bg-dark-slate;
      padding: 1rem;
    }
    .auth-box {
      background-color: $bg-card;
      padding: 3rem;
      border-radius: 12px;
      text-align: center;
      border: 1px solid $border-color;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 450px;
    }
    .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      h2 { margin: 0; font-size: 1.5rem; color: $primary-gold; letter-spacing: 0.2rem; }
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background-color: $primary-gold;
      color: $bg-dark-slate;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.25rem;
    }
    h3 { color: $text-main; margin-bottom: 0.5rem; font-weight: bold; }
    .subtitle { color: $text-muted; margin-bottom: 2.5rem; }

    .auth-form {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label { font-size: 0.85rem; color: $text-muted; text-transform: uppercase; letter-spacing: 0.05em; }
      input {
        background-color: color.adjust($bg-dark-slate, $lightness: -5%);
        border: 1px solid $border-color;
        color: $text-main;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 1rem;
        &:focus { outline: none; border-color: $primary-gold; }
      }
    }
    .btn-primary {
      margin-top: 1rem;
      width: 100%;
      padding: 1rem;
      background-color: $primary-gold;
      color: $bg-dark-slate;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1rem;
      transition: all 0.2s;
      &:disabled { opacity: 0.7; cursor: not-allowed; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(212, 175, 55, 0.3); }
    }
    .error-message {
      color: $error-red;
      font-size: 0.9rem;
      background-color: rgba($error-red, 0.1);
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba($error-red, 0.2);
    }
    .auth-footer {
      margin-top: 2rem;
      color: $text-muted;
      font-size: 0.9rem;
      a { color: $primary-gold; text-decoration: none; font-weight: bold; &:hover { text-decoration: underline; } }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    this.loading.set(true);
    this.error.set(null);
    
    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], { queryParams: { registered: true } });
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set('Registration failed. Email might already be taken.');
      }
    });
  }
}
