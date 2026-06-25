import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="flex items-center justify-between px-2 py-3">
      <p class="text-sm text-gray-500">
        Mostrando <span class="font-medium">{{ from() }}</span> – <span class="font-medium">{{ to() }}</span>
        de <span class="font-medium">{{ total() }}</span> registros
      </p>
      <div class="flex gap-1">
        <button (click)="go(page() - 1)" [disabled]="page() <= 1"
          class="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">
          ← Anterior
        </button>
        @for (p of pages(); track p) {
          <button (click)="go(p)"
            class="px-3 py-1.5 text-sm rounded-md border transition-colors"
            [class]="p === page() ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:bg-gray-50'">
            {{ p }}
          </button>
        }
        <button (click)="go(page() + 1)" [disabled]="page() >= totalPages()"
          class="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors">
          Siguiente →
        </button>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  page       = input.required<number>();
  totalPages = input.required<number>();
  total      = input.required<number>();
  limit      = input.required<number>();
  pageChange = output<number>();

  from = computed(() => Math.min((this.page() - 1) * this.limit() + 1, this.total()));
  to   = computed(() => Math.min(this.page() * this.limit(), this.total()));
  pages = computed(() => {
    const t = this.totalPages(), p = this.page();
    const start = Math.max(1, p - 2), end = Math.min(t, p + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  go(p: number) { if (p >= 1 && p <= this.totalPages()) this.pageChange.emit(p); }
}
