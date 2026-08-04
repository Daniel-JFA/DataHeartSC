import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser, AdminRole } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">Panel de Administración</h1>
        <p class="mt-1 text-sm text-slate-500">Gestión de usuarios y roles</p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="ml-3 text-slate-500">Cargando usuarios...</span>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error() }}
        </div>
      }

      <!-- Success toast -->
      @if (successMsg()) {
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {{ successMsg() }}
        </div>
      }

      <!-- Users table -->
      @if (!loading() && users().length > 0) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100">
            <h2 class="text-base font-semibold text-slate-800">Usuarios del sistema</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ users().length }} usuarios registrados</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 text-left">
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Nombre</th>
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Correo</th>
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Rol actual</th>
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Cambiar rol</th>
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Activo</th>
                  <th class="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Guardar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-slate-50 transition-colors">

                    <!-- Name -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                          <span class="text-xs font-bold text-white">
                            {{ user.firstName[0].toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-slate-900">{{ user.firstName }} {{ user.lastName }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Email -->
                    <td class="px-6 py-4 text-slate-500">{{ user.email }}</td>

                    <!-- Current role badge -->
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {{ user.role.name }}
                      </span>
                    </td>

                    <!-- Role select -->
                    <td class="px-6 py-4">
                      <select
                        [ngModel]="pendingRoleId(user.id) ?? user.role.id"
                        (ngModelChange)="setPendingRole(user.id, $event)"
                        class="block w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                        @for (role of roles(); track role.id) {
                          <option [value]="role.id">{{ role.name }}</option>
                        }
                      </select>
                    </td>

                    <!-- Active toggle -->
                    <td class="px-6 py-4">
                      <button
                        (click)="toggleActive(user.id, user.isActive)"
                        [class]="(pendingActive(user.id) ?? user.isActive)
                          ? 'relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600 transition-colors'
                          : 'relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition-colors'"
                        type="button"
                        [title]="(pendingActive(user.id) ?? user.isActive) ? 'Desactivar usuario' : 'Activar usuario'">
                        <span
                          [class]="(pendingActive(user.id) ?? user.isActive)
                            ? 'inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-6 transition-transform'
                            : 'inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-1 transition-transform'">
                        </span>
                      </button>
                    </td>

                    <!-- Save button -->
                    <td class="px-6 py-4">
                      <button
                        (click)="saveUser(user)"
                        [disabled]="saving() === user.id"
                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        @if (saving() === user.id) {
                          Guardando...
                        } @else {
                          Guardar
                        }
                      </button>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminPanelComponent implements OnInit {
  private adminSvc = inject(AdminService);
  auth = inject(AuthService);

  users = signal<AdminUser[]>([]);
  roles = signal<AdminRole[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  saving = signal<string | null>(null);

  // Pending edits per user id
  private pendingRoles = signal<Record<string, string>>({});
  private pendingActives = signal<Record<string, boolean>>({});

  pendingRoleId(userId: string): string | undefined {
    return this.pendingRoles()[userId];
  }

  pendingActive(userId: string): boolean | undefined {
    return this.pendingActives()[userId];
  }

  setPendingRole(userId: string, roleId: string) {
    this.pendingRoles.update(m => ({ ...m, [userId]: roleId }));
  }

  toggleActive(userId: string, currentActive: boolean) {
    const current = this.pendingActives()[userId] ?? currentActive;
    this.pendingActives.update(m => ({ ...m, [userId]: !current }));
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.adminSvc.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        // Load roles after users
        this.adminSvc.getRoles().subscribe({
          next: (roles) => {
            this.roles.set(roles);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set('Error al cargar roles: ' + (err?.message ?? 'Error desconocido'));
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set('Error al cargar usuarios: ' + (err?.message ?? 'Error desconocido'));
        this.loading.set(false);
      },
    });
  }

  saveUser(user: AdminUser) {
    const roleId = this.pendingRoles()[user.id];
    const isActive = this.pendingActives()[user.id];

    // Nothing changed
    if (roleId === undefined && isActive === undefined) return;

    const dto: { roleId?: string; isActive?: boolean } = {};
    if (roleId !== undefined) dto.roleId = roleId;
    if (isActive !== undefined) dto.isActive = isActive;

    this.saving.set(user.id);
    this.error.set(null);
    this.successMsg.set(null);

    this.adminSvc.updateUser(user.id, dto).subscribe({
      next: (updated) => {
        // Update user in the list
        this.users.update(list =>
          list.map(u => u.id === updated.id ? updated : u)
        );
        // Clear pending state for this user
        this.pendingRoles.update(m => { const n = { ...m }; delete n[user.id]; return n; });
        this.pendingActives.update(m => { const n = { ...m }; delete n[user.id]; return n; });
        this.saving.set(null);
        this.successMsg.set(`Usuario ${updated.firstName} ${updated.lastName} actualizado correctamente.`);
        setTimeout(() => this.successMsg.set(null), 4000);
      },
      error: (err) => {
        this.error.set('Error al guardar: ' + (err?.error?.message ?? err?.message ?? 'Error desconocido'));
        this.saving.set(null);
      },
    });
  }
}
