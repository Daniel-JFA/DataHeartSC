import { Component } from '@angular/core';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Voluntarios</h2>
        <p class="text-sm text-slate-500 mt-1">Gestión del equipo de voluntarios de la fundación</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" class="w-14 h-14 text-slate-300">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p class="text-slate-500 text-sm font-medium">Módulo en construcción</p>
        <p class="text-slate-400 text-xs">La gestión de voluntarios estará disponible pronto</p>
      </div>
    </div>
  `,
})
export class VoluntariosComponent {}
