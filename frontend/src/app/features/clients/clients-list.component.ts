import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientsService, Client, CreateClientPayload } from '../../core/services/clients.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PaginationComponent, DecimalPipe],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent {
  private svc = inject(ClientsService);
  private fb  = inject(FormBuilder);

  clients    = signal<Client[]>([]);
  total      = signal(0);
  totalPages = signal(1);
  page       = signal(1);
  limit      = signal(20);
  search     = signal('');
  loading    = signal(false);
  showForm   = signal(false);
  saving     = signal(false);
  error      = signal('');

  form = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(2)]],
    docType:      ['CC', Validators.required],
    docNumber:    ['', [Validators.required, Validators.minLength(4)]],
    phone:        [''],
    email:        ['', Validators.email],
    address:      [''],
    city:         [''],
    commune:      [''],
    neighborhood: [''],
  });

  constructor() {
    effect(() => { this.load(); }, { allowSignalWrites: true });
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), this.limit(), this.search()).subscribe({
      next: res => {
        this.clients.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onPageChange(p: number) { this.page.set(p); }

  openForm()  { this.showForm.set(true); this.form.reset({ docType: 'CC' }); this.error.set(''); }
  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    const payload = this.form.value as CreateClientPayload;
    this.svc.create(payload).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: { error?: { message?: string } })  => { this.error.set(e.error?.message || 'Error al guardar'); this.saving.set(false); },
    });
  }

  deactivate(client: Client) {
    if (!confirm(`¿Desactivar a ${client.name}?`)) return;
    this.svc.deactivate(client.id).subscribe({ next: () => this.load() });
  }

  docTypes = ['CC', 'NIT', 'CE', 'PA', 'TI', 'Otro'];
}
