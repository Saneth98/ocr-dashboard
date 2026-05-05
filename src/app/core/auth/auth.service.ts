import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authStatus = signal<boolean>(false);
  token = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  login(apiKeyType: string) {
    return this.http.post<{access_token: string}>('http://localhost:3000/auth/login', { apiKeyType }).pipe(
      tap(res => {
        this.token.set(res.access_token);
        this.authStatus.set(true);
      })
    );
  }
}
