import { Component } from '@angular/core';

@Component({
  selector: 'app-listas-difusion',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Listas Difusión WhatsApp</h2>
        <p class="text-sm text-slate-500 mt-1">Gestión de listas de difusión para comunicaciones masivas por WhatsApp</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" class="w-14 h-14 text-slate-300">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
        <p class="text-slate-500 text-sm font-medium">Módulo en construcción</p>
        <p class="text-slate-400 text-xs">Las listas de difusión WhatsApp estarán disponibles pronto</p>
      </div>
    </div>
  `,
})
export class ListasDifusionComponent {}
