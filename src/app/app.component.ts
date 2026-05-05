import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthService } from './core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DashboardComponent, CommonModule],
  template: `
    <div *ngIf="!authService.authStatus()" class="login-container">
      <div class="login-box">
        <h2>Mission Control Login</h2>
        <button (click)="login()">Login with Premium Auth</button>
      </div>
    </div>
    <div *ngIf="authService.authStatus()">
      <app-dashboard></app-dashboard>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .login-box {
      background-color: #1e293b;
      padding: 3rem;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #334155;
    }
    button {
      padding: 0.75rem 1.5rem;
      background-color: #d4af37;
      color: #0b1120;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);

  ngOnInit() {
  }

  login() {
    this.authService.login('premium').subscribe();
  }
}
