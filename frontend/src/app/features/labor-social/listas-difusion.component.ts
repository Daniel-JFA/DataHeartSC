import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Contact {
  id: string;
  name: string;
  docNumber: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
}

interface ContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-listas-difusion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './listas-difusion.component.html',
})
export class ListasDifusionComponent {
  private http = inject(HttpClient);

  contacts   = signal<Contact[]>([]);
  total      = signal(0);
  totalPages = signal(0);
  page       = signal(1);
  search     = signal('');
  loading    = signal(false);

  withPhone = computed(() => this.contacts().filter(c => !!c.phone).length);
  withEmail = computed(() => this.contacts().filter(c => !!c.email).length);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.page();
      this.load();
    }, { allowSignalWrites: true });
  }

  load() {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', 50);
    if (this.search()) params = params.set('search', this.search());

    this.http.get<ContactsResponse>(`${environment.apiUrl}/clients`, { params })
      .subscribe({
        next: res => {
          this.contacts.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(q: string) {
    this.search.set(q);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 350);
  }

  copyPhones() {
    const phones = this.contacts()
      .filter(c => !!c.phone)
      .map(c => c.phone as string)
      .join(', ');
    navigator.clipboard.writeText(phones);
  }

  copyEmails() {
    const emails = this.contacts()
      .filter(c => !!c.email)
      .map(c => c.email as string)
      .join(', ');
    navigator.clipboard.writeText(emails);
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
