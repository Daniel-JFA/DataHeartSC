import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface BlastForm {
  templateName: string;
  language: string;
  params: string;       // CSV: "Juan,Pérez,Medellín"
  phones: string;       // uno por línea
}

@Component({
  selector: 'app-listas-difusion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6 max-w-3xl mx-auto space-y-6">

      <!-- Header -->
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Listas Difusión WhatsApp</h2>
        <p class="text-sm text-slate-500 mt-1">
          Envío masivo de plantillas aprobadas por Meta a tus listas de contactos.
        </p>
      </div>

      <!-- Aviso si no hay API configurada -->
      <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
             class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd" />
        </svg>
        <p class="text-sm text-amber-800">
          <strong>Requiere WhatsApp Business API de Meta.</strong>
          Cuando tengas las credenciales, configura
          <code class="bg-amber-100 px-1 rounded text-xs">WABA_PHONE_NUMBER_ID</code> y
          <code class="bg-amber-100 px-1 rounded text-xs">WABA_ACCESS_TOKEN</code>
          en el <code class="bg-amber-100 px-1 rounded text-xs">.env</code> del backend.
          La infraestructura ya está lista.
        </p>
      </div>

      <!-- Formulario -->
      <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">

        <!-- Plantilla -->
        <div class="px-5 py-4 space-y-3">
          <h3 class="text-sm font-semibold text-slate-700">1. Plantilla de Meta</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre de la plantilla</label>
              <input [(ngModel)]="form().templateName"
                     (ngModelChange)="updateForm({ templateName: $event })"
                     placeholder="ej: bienvenida_beneficiario"
                     class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Idioma</label>
              <select [(ngModel)]="form().language"
                      (ngModelChange)="updateForm({ language: $event })"
                      class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="es_CO">Español Colombia (es_CO)</option>
                <option value="es">Español (es)</option>
                <option value="es_MX">Español México (es_MX)</option>
                <option value="en_US">Inglés (en_US)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">
              Parámetros del cuerpo
              <span class="text-slate-400 font-normal">(separados por coma, en orden)</span>
            </label>
            <input [(ngModel)]="form().params"
                   (ngModelChange)="updateForm({ params: $event })"
                   placeholder="ej: Juan,Pérez,Medellín"
                   class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <p class="text-xs text-slate-400 mt-1">
              Estos parámetros reemplazan los <code>&#123;&#123;1&#125;&#125;</code>, <code>&#123;&#123;2&#125;&#125;</code>... de la plantilla. Si son iguales para todos los destinatarios, escríbelos aquí.
            </p>
          </div>
        </div>

        <!-- Destinatarios -->
        <div class="px-5 py-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-700">2. Destinatarios</h3>
            @if (phoneCount() > 0) {
              <span class="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                {{ phoneCount() }} número{{ phoneCount() === 1 ? '' : 's' }}
              </span>
            }
          </div>
          <textarea [(ngModel)]="form().phones"
                    (ngModelChange)="updateForm({ phones: $event })"
                    rows="6"
                    placeholder="Un número por línea en formato internacional:&#10;573001234567&#10;573107654321&#10;573206543210"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none">
          </textarea>
          <p class="text-xs text-slate-400">
            Formato: código de país + número sin espacios ni guiones. Colombia → <code>57</code> + 10 dígitos.
          </p>
        </div>

        <!-- Acciones -->
        <div class="px-5 py-4 flex items-center justify-between gap-3">
          @if (result()) {
            <div [class]="result()!.failed === 0
              ? 'flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2'
              : 'flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              {{ result()!.sent }} enviados · {{ result()!.failed }} fallidos de {{ result()!.total }}
            </div>
          } @else {
            <span></span>
          }

          @if (error()) {
            <p class="text-sm text-red-600">{{ error() }}</p>
          }

          <button (click)="send()"
                  [disabled]="!canSend() || sending()"
                  class="flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            @if (sending()) {
              <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Enviando...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
              Enviar por WhatsApp
            }
          </button>
        </div>

      </div>

      <!-- Cómo funciona -->
      <div class="bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 space-y-2">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cómo funciona</h3>
        <ol class="text-sm text-slate-600 space-y-1 list-decimal list-inside">
          <li>Crea y aprueba la plantilla en <strong>Meta Business Suite → WhatsApp → Plantillas</strong></li>
          <li>Escribe aquí el nombre exacto de la plantilla aprobada</li>
          <li>Pega los números de los destinatarios (uno por línea)</li>
          <li>El backend envía cada mensaje con un intervalo para respetar el límite de Meta</li>
        </ol>
      </div>

    </div>
  `,
})
export class ListasDifusionComponent {
  private http = inject(HttpClient);

  sending = signal(false);
  result  = signal<{ sent: number; failed: number; total: number } | null>(null);
  error   = signal<string | null>(null);

  form = signal<BlastForm>({
    templateName: '',
    language:     'es_CO',
    params:       '',
    phones:       '',
  });

  updateForm(partial: Partial<BlastForm>) {
    this.form.update(f => ({ ...f, ...partial }));
    this.result.set(null);
    this.error.set(null);
  }

  phoneCount = computed(() =>
    this.form().phones.split('\n').map(p => p.trim()).filter(p => p.length > 6).length
  );

  canSend = computed(() =>
    this.form().templateName.trim().length > 0 && this.phoneCount() > 0
  );

  send() {
    if (!this.canSend() || this.sending()) return;
    this.sending.set(true);
    this.result.set(null);
    this.error.set(null);

    const f = this.form();
    const phones = f.phones.split('\n').map(p => p.trim()).filter(p => p.length > 6);
    const params = f.params.trim() ? f.params.split(',').map(p => p.trim()) : undefined;

    this.http.post<{ sent: number; failed: number; total: number }>(
      `${environment.apiUrl}/whatsapp/blast`,
      { phones, templateName: f.templateName, language: f.language, params },
    ).subscribe({
      next: res => {
        this.result.set(res);
        this.sending.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Error al enviar. Verifica las credenciales WABA.');
        this.sending.set(false);
      },
    });
  }
}
