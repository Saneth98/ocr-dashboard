import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .admin-container { padding: 2rem; background: #070d1a; min-height: 100vh; color: #f1f5f9; }
    h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.5rem; }
    .admin-badge { display: inline-block; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; padding: 0.2rem 0.75rem; margin-left: 0.75rem; vertical-align: middle; }
    .subtitle { color: #64748b; margin-bottom: 2.5rem; font-size: 0.9rem; }
    h2 { font-size: 1.1rem; font-weight: 600; color: #94a3b8; margin: 2rem 0 1rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    thead tr { background: #0f1929; }
    th { padding: 0.75rem 1rem; text-align: left; color: #64748b; font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1e293b; white-space: nowrap; }
    tbody tr { border-bottom: 1px solid #1e293b; transition: background 0.15s; }
    tbody tr:hover { background: rgba(255,255,255,0.02); }
    td { padding: 0.7rem 1rem; vertical-align: middle; }
    .badge { display: inline-block; border-radius: 999px; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.6rem; }
    .badge-success { background: rgba(16,185,129,0.15); color: #10b981; }
    .badge-error   { background: rgba(239,68,68,0.15);  color: #ef4444; }
    .badge-timeout { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .email-chip { background: rgba(99,102,241,0.12); color: #818cf8; border-radius: 6px; padding: 0.1rem 0.5rem; font-size: 0.78rem; }
    .loading { color: #475569; padding: 3rem; text-align: center; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #0f1929; border: 1px solid #1e293b; border-radius: 12px; padding: 1.25rem; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-value { font-size: 1.8rem; font-weight: 800; margin-top: 0.25rem; color: #f1f5f9; }
    .stat-value.red { color: #ef4444; }
    .stat-value.green { color: #10b981; }
    .stat-value.amber { color: #f59e0b; }
  `],
  template: `
    <div class="admin-container">
      <h1>Admin Panel <span class="admin-badge">RESTRICTED</span></h1>
      <p class="subtitle">Global audit log and API key registry for all users.</p>

      @if (loading()) {
        <div class="loading">Loading admin data...</div>
      } @else {
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Requests</div>
            <div class="stat-value">{{ logs().length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Successes</div>
            <div class="stat-value green">{{ countStatus('SUCCESS') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Timeouts</div>
            <div class="stat-value amber">{{ countStatus('TIMEOUT') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Errors</div>
            <div class="stat-value red">{{ countStatus('ERROR') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">API Keys</div>
            <div class="stat-value">{{ apiKeys().length }}</div>
          </div>
        </div>

        <!-- Global Audit Log -->
        <h2>Global Audit Log</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Credits</th>
                <th>Latency</th>
                <th>LLM Tokens</th>
                <th>Abuse?</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.requestId) {
                <tr>
                  <td>{{ log.createdAt | date:'short' }}</td>
                  <td><span class="email-chip">{{ log.user?.email ?? '—' }}</span></td>
                  <td>{{ log.providerUsed }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="log.status === 'SUCCESS'"
                          [class.badge-error]="log.status === 'ERROR'"
                          [class.badge-timeout]="log.status === 'TIMEOUT'">
                      {{ log.status }}
                    </span>
                  </td>
                  <td>{{ log.pageCount ?? '—' }}</td>
                  <td>{{ log.creditsDeducted ?? 0 }}</td>
                  <td>{{ log.latencyMs }}ms</td>
                  <td>{{ log.llmTotalTokens ?? '—' }}</td>
                  <td>{{ log.isTokenAbuseSuspicion ? '⚠️ YES' : '—' }}</td>
                  <td style="font-size:0.75rem; color:#ef4444; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    {{ log.errorCode ?? '' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- API Key Registry -->
        <h2>All API Keys</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User Email</th>
                <th>Key Name</th>
                <th>Key Hint</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              @for (key of apiKeys(); track key.id) {
                <tr>
                  <td><span class="email-chip">{{ key.userEmail }}</span></td>
                  <td>{{ key.name ?? '—' }}</td>
                  <td style="font-family:monospace; color:#94a3b8;">{{ key.key }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="key.isActive" [class.badge-error]="!key.isActive">
                      {{ key.isActive ? 'ACTIVE' : 'REVOKED' }}
                    </span>
                  </td>
                  <td>{{ key.createdAt | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  logs = signal<any[]>([]);
  apiKeys = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/auth/usage').subscribe({
      next: (data) => { this.logs.set(data); this.checkDone(); },
      error: () => this.checkDone()
    });
    this.http.get<any[]>('http://localhost:3000/auth/tokens').subscribe({
      next: (data) => { this.apiKeys.set(data); this.checkDone(); },
      error: () => this.checkDone()
    });
  }

  private _done = 0;
  private checkDone() { if (++this._done >= 2) this.loading.set(false); }

  countStatus(status: string) {
    return this.logs().filter(l => l.status === status).length;
  }
}
