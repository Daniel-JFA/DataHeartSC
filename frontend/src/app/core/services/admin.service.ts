import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: { permission: { id: string; keyName: string; name: string } }[];
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: { id: string; name: string; description: string };
}

export interface UpdateUserDto {
  roleId?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/users`);
  }

  getRoles(): Observable<AdminRole[]> {
    return this.http.get<AdminRole[]>(`${this.base}/roles`);
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${id}`, dto);
  }
}
