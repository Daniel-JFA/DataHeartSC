import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginPayload { email: string; password: string; }
export interface AuthResponse { access_token: string; user: { id: string; email: string; firstName: string; lastName: string; role: string; }; }

export interface AuthUser {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(null);

  constructor() {
    // Restore user from stored token on page load
    const token = localStorage.getItem('access_token');
    if (token) {
      const user = this.decodeToken(token);
      this.currentUser.set(user);
    }
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access_token);
        this.currentUser.set(this.decodeToken(res.access_token));
      }),
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  hasPermission(key: string): boolean {
    return this.currentUser()?.permissions.includes(key) ?? false;
  }

  private decodeToken(token: string): AuthUser | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as AuthUser;
    } catch {
      return null;
    }
  }
}
