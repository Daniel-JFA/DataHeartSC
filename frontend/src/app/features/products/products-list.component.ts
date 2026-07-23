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

  products       = signal<Product[]>([]);
  total          = signal(0);
  totalPages     = signal(1);
  page           = signal(1);
  limit          = signal(20);
  search         = signal('');
  categoryFilter = signal('');
  loading        = signal(false);

  readonly categorias = [
    'Donaciones',
    'Eventos',
    'Productos',
    'Otros Productos',
    'Programa Navidad',
    'Otros',
  ];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), this.limit(), this.search(), false, this.categoryFilter()).subscribe({
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

  onCategoryFilter(value: string) {
    this.categoryFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onPageChange(p: number) { this.page.set(p); this.load(); }

  lowStock = (p: Product) => p.stock <= p.minStock;

  formatPrice = (p: string) => `$${Number(p).toLocaleString('es-CO')}`;

  categoryBadge(cat: string): string {
    const map: Record<string, string> = {
      'Donaciones':       'bg-rose-100 text-rose-800 border border-rose-200',
      'Eventos':          'bg-purple-100 text-purple-800 border border-purple-200',
      'Productos':        'bg-blue-100 text-blue-800 border border-blue-200',
      'Otros Productos':  'bg-slate-100 text-slate-700 border border-slate-200',
      'Programa Navidad': 'bg-red-100 text-red-800 border border-red-200',
      'Otros':            'bg-amber-100 text-amber-700 border border-amber-200',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
