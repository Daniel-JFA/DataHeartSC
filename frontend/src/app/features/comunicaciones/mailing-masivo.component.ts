import { Component } from '@angular/core';

@Component({
  selector: 'app-mailing-masivo',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Mailing Masivo</h2>
        <p class="text-sm text-slate-500 mt-1">Envío de campañas de correo electrónico masivas</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" class="w-14 h-14 text-slate-300">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <p class="text-slate-500 text-sm font-medium">Módulo en construcción</p>
        <p class="text-slate-400 text-xs">El módulo de mailing masivo estará disponible pronto</p>
      </div>
    </div>
  `,
})
export class MailingMasivoComponent {}
