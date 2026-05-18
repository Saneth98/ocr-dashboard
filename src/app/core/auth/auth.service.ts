import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  currentUser = signal<any>(null);
  creditsRemaining = signal<number>(0);
  token = signal<string | null>(localStorage.getItem('token'));
  authStatus = computed(() => !!this.token());
  isAdmin = computed(() => !!this.currentUser()?.isAdmin);

  loadUserProfile() {
    this.http.get<any>(`${this.apiUrl}/me`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.creditsRemaining.set(user.creditsRemaining);
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        if (err.status === 401) this.logout();
      }
    });
  }

  loginWithCredentials(email: string, pass: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password: pass }).pipe(
      tap(res => {
        if (res.access_token) {
          localStorage.setItem('token', res.access_token);
          this.token.set(res.access_token);
          if (res.user) {
            this.currentUser.set(res.user);
            this.creditsRemaining.set(res.user.creditsRemaining ?? 0);
          }
          this.loadUserProfile();
        }
      })
    );
  }

  register(email: string, pass: string) {
    return this.http.post<any>(`${this.apiUrl}/signup`, { email, password: pass });
  }

  updateCredits(newCredits: number) {
    this.creditsRemaining.set(newCredits);
    if (this.currentUser()) {
      this.currentUser.set({ ...this.currentUser(), creditsRemaining: newCredits });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('dashboard_play_key');
    this.token.set(null);
    this.currentUser.set(null);
    this.creditsRemaining.set(0);
    window.location.href = '/login';
  }
}
