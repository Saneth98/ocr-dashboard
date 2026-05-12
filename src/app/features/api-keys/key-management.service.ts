import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyManagementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/auth';

  getKeys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tokens`);
  }

  generateKey(name: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tokens`, { name });
  }

  toggleKey(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tokens/${id}/toggle`, { isActive });
  }

  getUsage(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usage`);
  }
}
