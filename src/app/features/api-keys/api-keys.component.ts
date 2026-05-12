import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyManagementService } from './key-management.service';

@Component({
  selector: 'app-developer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="keys-container">
      <header>
        <div class="header-content">
          <h1>Developer Settings</h1>
          <p class="subtitle">Manage API keys and monitor usage</p>
        </div>
        <button class="btn-primary" (click)="createKey()">+ Generate New API Key</button>
      </header>

      <!-- New Key Alert (Shown Only Once) -->
      <div *ngIf="newKey()" class="new-key-alert">
        <div class="alert-content">
          <div class="alert-header">
            <span>Copy your new API key now!</span>
          </div>
          <p>For security, we only show this key once. If you lose it, you'll need to generate a new one.</p>
          <div class="key-display">
            <code>{{ newKey() }}</code>
            <button (click)="copyToClipboard(newKey()!)">Copy</button>
          </div>
          <button class="btn-close" (click)="newKey.set(null)">I've saved it</button>
        </div>
      </div>

      <div class="settings-grid">
        <section class="keys-section">
          <h3>Active API Keys</h3>
          <div class="keys-list">
            <div *ngIf="tokens().length === 0" class="empty-state">No keys found.</div>
            <div class="key-card" *ngFor="let token of tokens()" [class.inactive]="!token.isActive">
              <div class="key-info">
                <span class="key-name">{{ token.name || 'API Key' }}</span>
                <code class="key-hint">{{ token.key }}</code>
              </div>
              <div class="key-actions">
                <label class="switch">
                  <input type="checkbox" [checked]="token.isActive" (change)="toggleStatus(token)">
                  <span class="slider round"></span>
                </label>
                <button class="btn-danger-link" (click)="revokeKey(token.id)">Revoke</button>
              </div>
            </div>
          </div>
        </section>

        <section class="usage-section">
          <h3>Usage History (Recent 50 Requests)</h3>
          <div class="usage-list">
            <div *ngIf="usage().length === 0" class="empty-state">No usage recorded yet.</div>
            <div class="usage-item" *ngFor="let log of usage()">
              <div class="log-info">
                <span class="log-provider">{{ log.providerUsed }}</span>
                <span class="log-date">{{ log.createdAt | date:'short' }}</span>
              </div>
              <div class="log-meta">
                <span class="log-latency">{{ log.latencyMs }}ms</span>
                <span class="log-status" [class.success]="log.status === 'SUCCESS'">{{ log.status }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrl: './api-keys.component.scss'
})
export class DeveloperSettingsComponent implements OnInit {
  private keyService = inject(KeyManagementService);
  tokens = signal<any[]>([]);
  usage = signal<any[]>([]);
  newKey = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.keyService.getKeys().subscribe(res => this.tokens.set(res));
    this.keyService.getUsage().subscribe(res => this.usage.set(res));
  }

  createKey() {
    const name = prompt('Enter a name for this key:');
    if (!name) return;
    this.keyService.generateKey(name).subscribe(res => {
      this.newKey.set(res.plainTextKey);
      this.loadData();
    });
  }

  toggleStatus(token: any) {
    this.keyService.toggleKey(token.id, !token.isActive)
      .subscribe(() => this.loadData());
  }

  revokeKey(id: string) {
    if (confirm('Are you sure? This will permanently disable the key.')) {
      this.keyService.toggleKey(id, false)
        .subscribe(() => this.loadData());
    }
  }

  copyToClipboard(val: string) {
    navigator.clipboard.writeText(val);
    alert('Key copied to clipboard!');
  }
}


