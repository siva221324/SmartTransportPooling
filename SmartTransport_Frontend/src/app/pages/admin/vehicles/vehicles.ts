import { Component, inject, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { Vehicle } from '../../../models/vehicle.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-pending-vehicles',
  template: `
    <div class="pg-head">
      <div>
        <h2><i class="bi bi-shield-fill-check me-2"></i>Pending Vehicle Approvals</h2>
        <p>Review and approve driver vehicle registrations</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span style="padding:5px 14px;border-radius:50px;font-size:0.82rem;font-weight:600;background:rgba(241,196,15,0.12);color:#f1c40f">{{ vehicles().length }} pending</span>
        <button style="width:38px;height:38px;border-radius:10px;background:rgba(108,99,255,0.1);border:1px solid rgba(108,99,255,0.2);color:#8f88ff;display:flex;align-items:center;justify-content:center;cursor:pointer" (click)="load()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>

    @if (loading()) {
      <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    } @else if (vehicles().length === 0) {
      <div class="empty-state">
        <i class="bi bi-shield-check"></i>
        <h5>No pending vehicles</h5>
        <p>All vehicle registrations have been reviewed</p>
      </div>
    } @else {
      <div class="row g-4">
        @for (v of vehicles(); track v.id) {
          <div class="col-md-6 col-lg-4">
            <div class="card p-4 h-100">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 class="fw-bold mb-0">{{ v.model }}</h5>
                  <small class="text-muted">{{ v.licensePlate }}</small>
                </div>
                <span class="badge bg-warning text-dark"><i class="bi bi-hourglass me-1"></i>Pending</span>
              </div>

              <div class="mb-3">
                <p class="mb-1"><i class="bi bi-person me-2"></i><strong>{{ v.user.name }}</strong></p>
                <p class="mb-1"><i class="bi bi-envelope me-2"></i>{{ v.user.email }}</p>
                <p class="mb-1"><i class="bi bi-palette me-2"></i>{{ v.color || 'N/A' }}</p>
                <p class="mb-0"><i class="bi bi-people me-2"></i>{{ v.totalSeats }} seats</p>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-success flex-grow-1" (click)="approve(v.id)">
                  <i class="bi bi-check-circle me-1"></i> Approve
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
  `]
})
export class PendingVehicles implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  vehicles = signal<Vehicle[]>([]);
  loading = signal(true);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getPendingVehicles().subscribe({
      next: (v) => { this.vehicles.set(v); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load pending vehicles'); }
    });
  }

  approve(id: number) {
    this.adminService.approveVehicle(id).subscribe({
      next: () => { this.toast.success('Vehicle approved!'); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to approve')
    });
  }
}
