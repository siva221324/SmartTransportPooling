import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';

interface AdminStats {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  totalOrganizations: number;
  pendingVehicles: number;
  [key: string]: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-grid-1x2-fill me-2"></i>Admin Dashboard</h2>
      <p>Platform overview at a glance</p>
    </div>

    @if (loading()) {
      <div class="text-center py-5"><div class="spinner-border" style="color:#6c63ff"></div></div>
    } @else {
      <div class="stats-grid">
        <div class="acard" style="--c:#6c63ff"><div class="acard-ic"><i class="bi bi-people-fill"></i></div><div><span class="acard-num">{{ stats().totalUsers }}</span><small>Total Users</small></div></div>
        <div class="acard" style="--c:#2ecc71"><div class="acard-ic"><i class="bi bi-map-fill"></i></div><div><span class="acard-num">{{ stats().totalTrips }}</span><small>Total Trips</small></div></div>
        <div class="acard" style="--c:#3498db"><div class="acard-ic"><i class="bi bi-play-circle-fill"></i></div><div><span class="acard-num">{{ stats().activeTrips }}</span><small>Active Trips</small></div></div>
        <div class="acard" style="--c:#f39c12"><div class="acard-ic"><i class="bi bi-ticket-detailed-fill"></i></div><div><span class="acard-num">{{ stats().totalBookings }}</span><small>Total Bookings</small></div></div>
        <div class="acard" style="--c:#e74c3c"><div class="acard-ic"><i class="bi bi-building-fill"></i></div><div><span class="acard-num">{{ stats().totalOrganizations }}</span><small>Organizations</small></div></div>
        <div class="acard" style="--c:#9b59b6"><div class="acard-ic"><i class="bi bi-exclamation-triangle-fill"></i></div><div><span class="acard-num">{{ stats().pendingVehicles }}</span><small>Pending Vehicles</small></div></div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="panel"><div class="panel-body">
            <h6 class="fw-bold mb-2"><i class="bi bi-building-fill me-2" style="color:#6c63ff"></i>Organizations</h6>
            <p style="color:rgba(255,255,255,0.4);font-size:0.85rem">Manage corporate organizations and domains</p>
            <a routerLink="/admin/organizations" class="btn btn-primary btn-sm"><i class="bi bi-arrow-right me-1"></i>Manage</a>
          </div></div>
        </div>
        <div class="col-md-6">
          <div class="panel"><div class="panel-body">
            <h6 class="fw-bold mb-2"><i class="bi bi-shield-fill-check me-2" style="color:#2ecc71"></i>Vehicle Approvals</h6>
            <p style="color:rgba(255,255,255,0.4);font-size:0.85rem">Review and approve pending vehicle registrations</p>
            <a routerLink="/admin/vehicles" class="btn btn-primary btn-sm"><i class="bi bi-arrow-right me-1"></i>Review</a>
          </div></div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .acard {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px;
      transition: all 0.3s;
    }
    .acard:hover { border-color: var(--c); }
    .acard-ic {
      width: 42px; height: 42px; border-radius: 12px;
      background: color-mix(in srgb, var(--c) 15%, transparent);
      color: var(--c); display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .acard-num { font-size: 1.5rem; font-weight: 800; color: #fff; display: block; line-height: 1; }
    .acard small { color: rgba(255,255,255,0.35); font-size: 0.72rem; }
    .panel { background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
    .panel-body { padding: 20px; }
  `]
})
export class AdminDashboard implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  stats = signal<AdminStats>({ totalUsers: 0, totalTrips: 0, activeTrips: 0, totalBookings: 0, totalOrganizations: 0, pendingVehicles: 0 });
  loading = signal(true);

  ngOnInit() {
    this.admin.getStats().subscribe({
      next: (s: any) => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load stats'); }
    });
  }
}
