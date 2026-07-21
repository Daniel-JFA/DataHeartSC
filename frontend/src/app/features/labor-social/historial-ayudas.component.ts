import { Component } from '@angular/core';

@Component({
  selector: 'app-historial-ayudas',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Historial Ayudas Beneficiarios</h2>
        <p class="text-sm text-slate-500 mt-1">Registro consolidado de todas las ayudas entregadas</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" class="w-14 h-14 text-rose-300">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <p class="text-slate-500 text-sm font-medium">Módulo en construcción</p>
        <p class="text-slate-400 text-xs">El historial consolidado de ayudas estará disponible pronto</p>
      </div>
    </div>
  `,
})
export class HistorialAyudasComponent {}
