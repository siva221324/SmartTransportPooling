import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle, VehicleRequest } from '../../models/vehicle.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-vehicles',
  imports: [FormsModule],
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-car-front-fill me-2"></i>My Vehicles</h2>
      <p>Register and manage your vehicles</p>
    </div>

    <!-- Register Form -->
    <div class="panel mb-4">
      <div class="panel-head"><h6>Register New Vehicle</h6></div>
      <div class="panel-body">
        @if (message) {
          <div class="alert" [class]="msgType === 'success' ? 'alert-success' : 'alert-danger'">{{ message }}</div>
        }
        <form (ngSubmit)="onRegister()" class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label">License Plate</label>
            <input type="text" class="form-control" [(ngModel)]="form.licensePlate" name="licensePlate" required placeholder="KA-01-AB-1234">
          </div>
          <div class="col-md-3">
            <label class="form-label">Model</label>
            <input type="text" class="form-control" [(ngModel)]="form.model" name="model" required placeholder="Swift Dzire">
          </div>
          <div class="col-md-2">
            <label class="form-label">Color</label>
            <input type="text" class="form-control" [(ngModel)]="form.color" name="color" placeholder="White">
          </div>
          <div class="col-md-2">
            <label class="form-label">Total Seats</label>
            <input type="number" class="form-control" [(ngModel)]="form.totalSeats" name="totalSeats" min="1" required>
          </div>
          <div class="col-md-2">
            <button type="submit" class="btn btn-primary w-100"><i class="bi bi-plus-lg me-1"></i> Register</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Vehicle List -->
    @if (vehicles().length === 0) {
      <div class="empty-state">
        <i class="bi bi-car-front"></i>
        <h5>No vehicles registered</h5>
      </div>
    } @else {
      <div class="vehicle-grid">
        @for (v of vehicles(); track v.id) {
          <div class="vcard">
            <div class="vcard-top">
              <h6 class="fw-bold mb-0" style="color:#f0f0f5">{{ v.model }}</h6>
              @if (v.approved) {
                <span class="v-tag ok"><i class="bi bi-check-circle me-1"></i>Approved</span>
              } @else {
                <span class="v-tag wait"><i class="bi bi-hourglass me-1"></i>Pending</span>
              }
            </div>
            <div class="vcard-info">
              <div class="vi-row"><i class="bi bi-credit-card"></i>{{ v.licensePlate }}</div>
              <div class="vi-row"><i class="bi bi-palette"></i>{{ v.color || 'N/A' }}</div>
              <div class="vi-row"><i class="bi bi-people"></i>{{ v.totalSeats }} seats</div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }

    .panel { background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
    .panel-head { padding: 16px 20px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .panel-head h6 { margin: 0; font-weight: 700; color: #f0f0f5; }
    .panel-body { padding: 20px; }

    .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .vcard {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 20px; transition: all 0.3s;
    }
    .vcard:hover { border-color: rgba(108,99,255,0.2); transform: translateY(-2px); }
    .vcard-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .v-tag { font-size: 0.72rem; font-weight: 600; padding: 3px 10px; border-radius: 50px; }
    .v-tag.ok { background: rgba(46,204,113,0.12); color: #2ecc71; }
    .v-tag.wait { background: rgba(241,196,15,0.12); color: #f1c40f; }
    .vcard-info { display: flex; flex-direction: column; gap: 6px; }
    .vi-row { font-size: 0.88rem; color: rgba(255,255,255,0.5); }
    .vi-row i { margin-right: 8px; color: rgba(255,255,255,0.25); }
  `]
})
export class MyVehicles implements OnInit {
  private vehicleService = inject(VehicleService);
  private toast = inject(ToastService);

  vehicles = signal<Vehicle[]>([]);
  form: VehicleRequest = { licensePlate: '', model: '', color: '', totalSeats: 4, licenseDocUrl: '' };
  message = '';
  msgType = '';

  ngOnInit() { this.load(); }

  load() {
    this.vehicleService.getMyVehicles().subscribe({
      next: v => this.vehicles.set(v),
      error: () => this.toast.error('Failed to load vehicles')
    });
  }

  onRegister() {
    this.message = '';
    this.vehicleService.registerVehicle(this.form).subscribe({
      next: () => {
        this.toast.success('Vehicle registered! Awaiting admin approval.');
        this.message = 'Vehicle registered! Awaiting admin approval.';
        this.msgType = 'success';
        this.form = { licensePlate: '', model: '', color: '', totalSeats: 4, licenseDocUrl: '' };
        this.load();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Registration failed');
        this.message = err.error?.message || 'Registration failed';
        this.msgType = 'error';
      }
    });
  }
}

