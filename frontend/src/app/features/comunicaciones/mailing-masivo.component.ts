import { Component, inject, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface MailForm {
  subject: string;
  body: string;
  filterCity: string;
  filterStatus: string;
  campaignLabel: string;
}

@Component({
  selector: 'app-mailing-masivo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mailing-masivo.component.html',
})
export class MailingMasivoComponent {
  private http      = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('bodyRef') bodyRef!: ElementRef<HTMLTextAreaElement>;

  readonly variables = ['{nombre}', '{apellido}', '{email}', '{ciudad}'];

  sending        = signal(false);
  sent           = signal(false);
  error          = signal<string | null>(null);
  step           = signal<'compose' | 'confirm'>('compose');
  previewMode    = signal(false);
  recipientCount = signal<number | null>(null);
  loadingCount   = signal(false);

  private countTimer: ReturnType<typeof setTimeout> | null = null;

  form = signal<MailForm>({
    subject:       '',
    body:          '',
    filterCity:    '',
    filterStatus:  'Todos',
    campaignLabel: '',
  });

  canConfirm = computed(() => {
    const f = this.form();
    return f.subject.trim().length > 0 && f.body.trim().length > 0;
  });

  previewHtml = computed<SafeHtml>(() => {
    const body = this.form().body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(body);
  });

  constructor() {
    // Refresh count when filters change
    effect(() => {
      this.form();
      this.scheduleCountRefresh();
    });

    // Initial count
    this.refreshCount();
  }

  updateForm(partial: Partial<MailForm>) {
    this.form.update(f => ({ ...f, ...partial }));
  }

  scheduleCountRefresh() {
    if (this.countTimer) clearTimeout(this.countTimer);
    this.countTimer = setTimeout(() => this.refreshCount(), 600);
  }

  refreshCount() {
    this.loadingCount.set(true);
    const f = this.form();
    let params = new HttpParams().set('page', 1).set('limit', 1).set('hasEmail', 'true');
    if (f.filterCity.trim())            params = params.set('city', f.filterCity.trim());
    if (f.filterStatus !== 'Todos')     params = params.set('status', f.filterStatus);

    this.http.get<{ total: number }>(`${environment.apiUrl}/clients/segment`, { params })
      .subscribe({
        next: res  => { this.recipientCount.set(res.total); this.loadingCount.set(false); },
        error: ()  => { this.recipientCount.set(null);      this.loadingCount.set(false); },
      });
  }

  insertVar(variable: string) {
    const ta = this.bodyRef?.nativeElement;
    if (!ta) {
      this.updateForm({ body: this.form().body + variable });
      return;
    }
    const start = ta.selectionStart ?? 0;
    const end   = ta.selectionEnd   ?? 0;
    const current = this.form().body;
    const next = current.slice(0, start) + variable + current.slice(end);
    this.updateForm({ body: next });
    setTimeout(() => {
      ta.focus();
      const pos = start + variable.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  wrapSelection(before: string, after: string) {
    const ta = this.bodyRef?.nativeElement;
    if (!ta) return;
    const start   = ta.selectionStart ?? 0;
    const end     = ta.selectionEnd   ?? 0;
    const current = this.form().body;
    const selected = current.slice(start, end) || 'texto';
    const next = current.slice(0, start) + before + selected + after + current.slice(end);
    this.updateForm({ body: next });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  bold()   { this.wrapSelection('**', '**'); }
  italic() { this.wrapSelection('*', '*');   }

  goToConfirm() {
    if (!this.canConfirm()) return;
    this.step.set('confirm');
  }

  backToCompose() {
    this.step.set('compose');
  }

  send() {
    if (!this.canConfirm()) return;
    this.sending.set(true);
    this.sent.set(false);
    this.error.set(null);

    this.http.post(`${environment.apiUrl}/clients/mail-blast`, this.form()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
        this.step.set('compose');
        this.form.update(f => ({ ...f, subject: '', body: '', campaignLabel: '' }));
      },
      error: err => {
        this.sending.set(false);
        this.error.set(err?.error?.message ?? 'Ocurrió un error al enviar la campaña.');
        this.step.set('compose');
      },
    });
  }
}
