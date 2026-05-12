import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <header>
        <h1>Account Settings</h1>
        <p class="subtitle">Manage your profile and subscription</p>
      </header>

      <div class="settings-grid">
        <!-- Profile Card -->
        <div class="settings-card">
          <h3>Profile Information</h3>
          <div class="info-group">
            <label>Email Address</label>
            <div class="value">{{ user()?.email }}</div>
          </div>
          <div class="info-group">
            <label>Account Status</label>
            <div class="value badge success">Active</div>
          </div>
          <div class="info-group">
            <label>User Roles</label>
            <div class="value">{{ user()?.roles || 'user' }}</div>
          </div>
        </div>

        <!-- Credits Card -->
        <div class="settings-card highlight">
          <h3>Credits & Usage</h3>
          <div class="credits-display">
            <span class="count">{{ user()?.creditsRemaining || 0 }}</span>
            <span class="label">Credits Remaining</span>
          </div>
          <button class="btn-primary" (click)="topUp()">Top Up Credits</button>
        </div>

        <!-- Security Card -->
        <div class="settings-card">
          <h3>Security</h3>
          <p>Update your password to keep your account secure.</p>
          <div class="password-form" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="input-group">
              <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">Current Password</label>
              <input type="password" [(ngModel)]="currentPass" placeholder="Current Password" style="width: 100%; padding: 0.5rem; background: #0b1120; border: 1px solid #334155; color: white; border-radius: 4px;">
            </div>
            <div class="input-group">
              <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">New Password</label>
              <input type="password" [(ngModel)]="newPass" placeholder="New Password" style="width: 100%; padding: 0.5rem; background: #0b1120; border: 1px solid #334155; color: white; border-radius: 4px;">
            </div>
            <div class="input-group">
              <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 0.25rem;">Confirm New Password</label>
              <input type="password" [(ngModel)]="confirmPass" placeholder="Confirm New Password" style="width: 100%; padding: 0.5rem; background: #0b1120; border: 1px solid #334155; color: white; border-radius: 4px;">
            </div>
            <button class="btn-outline" (click)="changePassword()">Update Password</button>
          </div>
          <div *ngIf="message()" [style.color]="isError() ? '#ef4444' : '#10b981'" style="margin-top: 0.5rem;">{{ message() }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit {

  private http = inject(HttpClient);
  user = signal<any>(null);
  currentPass = '';
  newPass = '';
  confirmPass = '';
  message = signal('');
  isError = signal(false);

  ngOnInit() {
    this.http.get('http://localhost:3000/auth/me').subscribe({
      next: (res) => this.user.set(res),
      error: (err) => console.error('Account load error:', err)
    });
  }

  changePassword() {
    if (!this.currentPass || !this.newPass || !this.confirmPass) {
      this.isError.set(true);
      this.message.set('Please fill all password fields.');
      return;
    }
    if (this.newPass !== this.confirmPass) {
      this.isError.set(true);
      this.message.set('New passwords do not match.');
      return;
    }
    
    this.http.post('http://localhost:3000/auth/change-password', { 
      currentPassword: this.currentPass, 
      newPassword: this.newPass 
    })
      .subscribe({
        next: () => {
          this.isError.set(false);
          this.message.set('Password updated successfully!');
          this.currentPass = '';
          this.newPass = '';
          this.confirmPass = '';
        },
        error: (err) => {
          this.isError.set(true);
          this.message.set(err.error?.message || 'Update failed.');
        }
      });
  }

  topUp() {
    alert('Redirecting to Stripe...');
  }
}


