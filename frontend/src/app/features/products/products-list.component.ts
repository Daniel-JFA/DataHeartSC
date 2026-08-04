import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductsService, Product, CategoryStat } from '../../core/services/products.service';
import { CurrencyPipe } from '@angular/common';

interface SubcategoryGroup {
  name: string;
  products: Product[];
  lowStockCount: number;
}

interface CategoryView {
  name: string;
  subcategories: SubcategoryGroup[];
  total: number;
  lowStockCount: number;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  private svc = inject(ProductsService);

  // --- State ---
  categoryStats  = signal<CategoryStat[]>([]);
  allProducts    = signal<Product[]>([]);
  activeCategory = signal('');
  search         = signal('');
  loading        = signal(false);
  loadingCats    = signal(true);
  expandedSubs   = signal<Set<string>>(new Set());
  showInactive   = signal(false);

  // --- Movement modal state ---
  movementProduct  = signal<Product | null>(null);
  movementType     = signal<'Entrada' | 'Salida'>('Entrada');
  movementQty      = signal<number | null>(null);
  movementNote     = signal('');
  movementLoading  = signal(false);
  movementError    = signal('');

  // --- Derived ---
  filteredProducts = computed(() => {
    const q = this.search().toLowerCase().trim();
    const cat = this.activeCategory();
    const showAll = this.showInactive();
    return this.allProducts().filter(p => {
      if (!showAll && !p.isActive) return false;
      const matchCat = cat === ''
        ? true
        : cat === 'Sin categoría'
          ? !p.categoryName
          : p.categoryName === cat;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  });

  categoryView = computed<CategoryView | null>(() => {
    const products = this.filteredProducts();
    if (products.length === 0) return null;

    const cat = this.activeCategory() || 'Todos';

    const subMap = new Map<string, Product[]>();
    for (const p of products) {
      const sub = p.subcategoryName ?? 'Sin subcategoría';
      if (!subMap.has(sub)) subMap.set(sub, []);
      subMap.get(sub)!.push(p);
    }

    const subcategories: SubcategoryGroup[] = [...subMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([name, prods]) => ({
        name,
        products: prods.sort((a, b) => a.name.localeCompare(b.name, 'es')),
        lowStockCount: prods.filter(p => p.isActive && p.stock <= p.minStock).length,
      }));

    const lowStockCount = subcategories.reduce((s, g) => s + g.lowStockCount, 0);

    return { name: cat, subcategories, total: products.length, lowStockCount };
  });

  constructor() {
    this.loadCategoriesAndProducts();
  }

  loadCategoriesAndProducts() {
    this.loadingCats.set(true);
    this.svc.getCategoryStats(/* onlyActive */ true).subscribe({
      next: stats => {
        this.categoryStats.set(stats);
        this.loadingCats.set(false);
        if (stats.length > 0) this.activeCategory.set(stats[0].name);
        this.loadProducts();
      },
      error: () => { this.loadingCats.set(false); this.loadProducts(); },
    });
  }

  loadProducts() {
    this.loading.set(true);
    // Load all products — client-side filtering handles active/inactive toggle
    this.svc.getAll(1, 9999, '', false, '').subscribe({
      next: res => {
        this.allProducts.set(res.data);
        this.loading.set(false);
        const subs = new Set(res.data.map(p => p.subcategoryName ?? 'Sin subcategoría'));
        this.expandedSubs.set(subs);
      },
      error: () => this.loading.set(false),
    });
  }

  setCategory(name: string) {
    this.activeCategory.set(name);
    this.search.set('');
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.search.set(q);
    if (q) this.activeCategory.set('');
    else if (this.categoryStats().length > 0) this.activeCategory.set(this.categoryStats()[0].name);
  }

  toggleSub(name: string) {
    this.expandedSubs.update(s => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  isExpanded(name: string): boolean {
    return this.expandedSubs().has(name);
  }

  lowStock(p: Product): boolean { return p.isActive && p.stock <= p.minStock; }

  formatPrice(price: string): string {
    return `$${Number(price).toLocaleString('es-CO')}`;
  }

  categoryTabClass(name: string): string {
    const active = this.activeCategory() === name;
    return active
      ? 'border-b-2 border-brand-600 text-brand-700 font-semibold bg-white'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium';
  }

  categoryBadge(cat: string): string {
    const map: Record<string, string> = {
      'Donaciones':       'bg-rose-100 text-rose-800',
      'Eventos':          'bg-purple-100 text-purple-800',
      'Productos':        'bg-blue-100 text-blue-800',
      'Otros Productos':  'bg-slate-100 text-slate-700',
      'Programa Navidad': 'bg-red-100 text-red-800',
      'Otros':            'bg-amber-100 text-amber-700',
      'Sin categoría':    'bg-slate-100 text-slate-500',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-700';
  }

  // --- Activate / Deactivate ---
  toggleActive(p: Product) {
    this.svc.toggleActive(p.id).subscribe({
      next: ({ isActive }) => {
        this.allProducts.update(list =>
          list.map(x => x.id === p.id ? { ...x, isActive } : x)
        );
      },
    });
  }

  // --- Stock movement modal ---
  openMovement(p: Product) {
    this.movementProduct.set(p);
    this.movementType.set('Entrada');
    this.movementQty.set(null);
    this.movementNote.set('');
    this.movementError.set('');
  }

  closeMovement() {
    this.movementProduct.set(null);
  }

  submitMovement() {
    const p = this.movementProduct();
    const qty = this.movementQty();
    if (!p || !qty || qty < 1) {
      this.movementError.set('Ingrese una cantidad válida (mínimo 1).');
      return;
    }

    this.movementLoading.set(true);
    this.movementError.set('');

    this.svc.stockMovement(p.id, {
      movementType: this.movementType(),
      quantity: qty,
      description: this.movementNote() || undefined,
    }).subscribe({
      next: updated => {
        this.allProducts.update(list =>
          list.map(x => x.id === updated.id ? { ...x, stock: updated.stock } : x)
        );
        this.movementLoading.set(false);
        this.closeMovement();
      },
      error: (err) => {
        this.movementError.set(err?.error?.message ?? 'Error al registrar el movimiento.');
        this.movementLoading.set(false);
      },
    });
  }
}
