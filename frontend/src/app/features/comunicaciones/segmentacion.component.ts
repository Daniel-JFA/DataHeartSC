import { Component } from '@angular/core';

@Component({
  selector: 'app-segmentacion',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Segmentación Base de Datos</h2>
        <p class="text-sm text-slate-500 mt-1">Segmentación y clasificación de contactos para comunicaciones</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" class="w-14 h-14 text-slate-300">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.5 2A1.5 1.5 0 002 3.5V5c0 1.149.16 2.26.461 3.314A12.056 12.056 0 0011.686 17.54 12.056 12.056 0 0015 18h1.5a1.5 1.5 0 001.5-1.5v-1.396a1.5 1.5 0 00-1.135-1.455l-2.553-.638a1.5 1.5 0 00-1.635.61l-.53.795a10.555 10.555 0 01-3.564-3.564l.796-.529a1.5 1.5 0 00.609-1.635l-.638-2.553A1.5 1.5 0 004.896 4H3.5z" />
        </svg>
        <p class="text-slate-500 text-sm font-medium">Módulo en construcción</p>
        <p class="text-slate-400 text-xs">La segmentación de base de datos estará disponible pronto</p>
      </div>
    </div>
  `,
})
export class SegmentacionComponent {}
