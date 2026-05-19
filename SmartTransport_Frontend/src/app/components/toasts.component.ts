import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show align-items-center border-0"
             [class.text-bg-success]="toast.type === 'success'"
             [class.text-bg-danger]="toast.type === 'error'"
             [class.text-bg-warning]="toast.type === 'warning'"
             [class.text-bg-info]="toast.type === 'info'"
             role="alert">
          <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
              @switch (toast.type) {
                @case ('success') { <i class="bi bi-check-circle-fill"></i> }
                @case ('error') { <i class="bi bi-x-circle-fill"></i> }
                @case ('warning') { <i class="bi bi-exclamation-triangle-fill"></i> }
                @case ('info') { <i class="bi bi-info-circle-fill"></i> }
              }
              {{ toast.message }}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    (click)="toastService.dismiss(toast.id)"></button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastsComponent {
  toastService = inject(ToastService);
}

