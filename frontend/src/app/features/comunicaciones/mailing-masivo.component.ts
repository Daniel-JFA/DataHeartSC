import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface MailForm {
  subject: string;
  body: string;
  filterCity: string;
  filterStatus: string;
}

@Component({
  selector: 'app-mailing-masivo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mailing-masivo.component.html',
})
export class MailingMasivoComponent {
  private http = inject(HttpClient);

  sending = signal(false);
  sent    = signal(false);
  error   = signal<string | null>(null);

  form = signal<MailForm>({
    subject: '',
    body: '',
    filterCity: '',
    filterStatus: 'Todos',
  });

  updateForm(partial: Partial<MailForm>) {
    this.form.update(f => ({ ...f, ...partial }));
  }

  send() {
    if (!this.form().subject.trim() || !this.form().body.trim()) return;

    this.sending.set(true);
    this.sent.set(false);
    this.error.set(null);

    const payload = { ...this.form() };

    this.http.post(`${environment.apiUrl}/clients/mail-blast`, payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err?.error?.message ?? 'Ocurrió un error al enviar el correo. Inténtalo de nuevo.');
      },
    });
  }
}
