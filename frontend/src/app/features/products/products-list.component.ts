import { Component, inject, signal } from '@angular/core';
import { ProductsService, Product } from '../../core/services/products.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [PaginationComponent],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  private svc = inject(ProductsService);

  products   = signal<Product[]>([]);
  total      = signal(0);
  totalPages = signal(1);
  page       = signal(1);
  limit      = signal(20);
  search     = signal('');
  loading    = signal(false);

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), this.limit(), this.search()).subscribe({
      next: res => {
        this.products.set(res.data);
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
    this.load();
  }

  onPageChange(p: number) { this.page.set(p); this.load(); }

  lowStock = (p: Product) => p.stock <= p.minStock;

  formatPrice = (p: string) => `$${Number(p).toLocaleString('es-CO')}`;
}
