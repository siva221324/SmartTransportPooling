import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  template: `
    <!-- Header -->
    <div class="dash-header">
      <div>
        <h2>Welcome back, {{ userName() }} <span class="wave">👋</span></h2>
        <p>Here's what's happening with your rides today.</p>
      </div>
      <button class="refresh-btn" (click)="refresh()">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="scard" style="--accent:#6c63ff">
        <div class="scard-icon"><i class="bi bi-geo-alt-fill"></i></div>
        <div class="scard-data">
          <span class="scard-num">{{ totalTrips() }}</span>
          <span class="scard-label">My Trips</span>
        </div>
      </div>
      <div class="scard" style="--accent:#2ecc71">
        <div class="scard-icon"><i class="bi bi-ticket-detailed-fill"></i></div>
        <div class="scard-data">
          <span class="scard-num">{{ totalBookings() }}</span>
          <span class="scard-label">My Bookings</span>
        </div>
      </div>
      <div class="scard" style="--accent:#f39c12">
        <div class="scard-icon"><i class="bi bi-hourglass-split"></i></div>
        <div class="scard-data">
          <span class="scard-num">{{ pendingCount() }}</span>
          <span class="scard-label">Pending</span>
        </div>
      </div>
      <div class="scard" style="--accent:#3498db">
        <div class="scard-icon"><i class="bi bi-lightning-charge-fill"></i></div>
        <div class="scard-data">
          <span class="scard-num">{{ activeCount() }}</span>
          <span class="scard-label">Active</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions-bar">
      <a routerLink="/search-trips" class="action-pill" style="--c:#6c63ff">
        <i class="bi bi-search-heart"></i> Search Rides
      </a>
      <a routerLink="/create-trip" class="action-pill" style="--c:#2ecc71">
        <i class="bi bi-plus-circle-fill"></i> Create Trip
      </a>
      <a routerLink="/my-bookings" class="action-pill" style="--c:#f39c12">
        <i class="bi bi-ticket-detailed-fill"></i> Bookings
      </a>
      <a routerLink="/my-trips" class="action-pill" style="--c:#3498db">
        <i class="bi bi-map-fill"></i> My Trips
      </a>
    </div>

    <div class="row g-4">
      <!-- Active Trips -->
      <div class="col-lg-6">
        <div class="panel">
          <div class="panel-head">
            <h6><i class="bi bi-play-circle-fill text-success me-2"></i>Active / Upcoming</h6>
          </div>
          @if (activeTrips().length === 0) {
            <div class="empty-state"><i class="bi bi-calendar-x"></i><h5>No active trips</h5></div>
          } @else {
            @for (trip of activeTrips().slice(0, 5); track trip.id) {
              <div class="trip-row">
                <div class="trip-route">
                  <span class="dot-from"></span>
                  <span>{{ trip.origin }}</span>
                  <i class="bi bi-arrow-right mx-2" style="color:rgba(255,255,255,0.2)"></i>
                  <span class="dot-to"></span>
                  <span>{{ trip.destination }}</span>
                </div>
                <div class="trip-meta">
                  <span><i class="bi bi-clock me-1"></i>{{ trip.departureTime | date:'MMM d, h:mm a' }}</span>
                  <span><i class="bi bi-person me-1"></i>{{ trip.availableSeats }} seats</span>
                </div>
                <div class="trip-actions">
                  <span class="badge-status badge-{{ trip.status.toLowerCase() }}">{{ trip.status }}</span>
                  <a [routerLink]="['/trip', trip.id]" class="view-btn"><i class="bi bi-arrow-right"></i></a>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Recent Bookings -->
      <div class="col-lg-6">
        <div class="panel">
          <div class="panel-head">
            <h6><i class="bi bi-clock-history me-2" style="color:#f39c12"></i>Recent Bookings</h6>
            @if (bookings().length > 5) {
              <a routerLink="/my-bookings" class="see-all">View all →</a>
            }
          </div>
          @if (bookings().length === 0) {
            <div class="empty-state"><i class="bi bi-inbox"></i><h5>No bookings yet</h5></div>
          } @else {
            @for (b of bookings().slice(0, 5); track b.id) {
              <div class="booking-row">
                <div class="booking-route">
                  {{ b.trip.origin }} <i class="bi bi-arrow-right mx-1" style="color:rgba(255,255,255,0.2)"></i> {{ b.trip.destination }}
                </div>
                <div class="booking-info">
                  <span>{{ b.trip.departureTime | date:'MMM d' }}</span>
                  <strong style="color:#2ecc71">₹{{ b.fare }}</strong>
                  <span class="badge-status badge-{{ b.status.toLowerCase() }}">{{ b.status }}</span>
                  <a [routerLink]="['/trip', b.trip.id]" class="view-btn"><i class="bi bi-eye"></i></a>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dash-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px;
    }
    .dash-header h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .dash-header p { color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 0.9rem; }
    .wave { display: inline-block; animation: wave 1.5s ease-in-out infinite; transform-origin: 70% 70%; }
    @keyframes wave { 0%,100%{transform:rotate(0)} 25%{transform:rotate(20deg)} 50%{transform:rotate(-10deg)} 75%{transform:rotate(15deg)} }
    .refresh-btn {
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.2);
      color: #8f88ff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; font-size: 1rem;
    }
    .refresh-btn:hover { background: rgba(108,99,255,0.2); transform: rotate(90deg); }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .scard {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px;
      transition: all 0.3s;
    }
    .scard:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
    .scard-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: color-mix(in srgb, var(--accent) 15%, transparent);
      color: var(--accent); display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
    }
    .scard-num { font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1; }
    .scard-label { font-size: 0.78rem; color: rgba(255,255,255,0.4); }
    .scard-data { display: flex; flex-direction: column; gap: 2px; }

    /* Actions */
    .actions-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
    .action-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 50px;
      background: color-mix(in srgb, var(--c) 10%, transparent);
      color: var(--c); border: 1px solid color-mix(in srgb, var(--c) 20%, transparent);
      text-decoration: none; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .action-pill:hover { background: color-mix(in srgb, var(--c) 20%, transparent); color: #fff; transform: translateY(-1px); }

    /* Panels */
    .panel {
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px; overflow: hidden; height: 100%;
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 20px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .panel-head h6 { margin: 0; font-weight: 700; color: #f0f0f5; font-size: 0.95rem; }
    .see-all { font-size: 0.8rem; color: #8f88ff; text-decoration: none; font-weight: 600; }
    .see-all:hover { color: #fff; }

    /* Trip rows */
    .trip-row {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.2s;
    }
    .trip-row:hover { background: rgba(108,99,255,0.04); }
    .trip-row:last-child { border-bottom: none; }
    .trip-route { display: flex; align-items: center; font-weight: 600; font-size: 0.9rem; color: #f0f0f5; }
    .trip-meta { display: flex; gap: 14px; font-size: 0.78rem; color: rgba(255,255,255,0.35); margin-top: 2px; width: 100%; }
    .trip-actions { display: flex; align-items: center; gap: 8px; }
    .dot-from, .dot-to {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px;
    }
    .dot-from { background: #6c63ff; }
    .dot-to { background: #e74c3c; }
    .view-btn {
      width: 30px; height: 30px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      background: rgba(108,99,255,0.1); color: #8f88ff; text-decoration: none;
      transition: all 0.2s; font-size: 0.85rem;
    }
    .view-btn:hover { background: rgba(108,99,255,0.25); color: #fff; }

    /* Booking rows */
    .booking-row {
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.2s;
    }
    .booking-row:hover { background: rgba(108,99,255,0.04); }
    .booking-row:last-child { border-bottom: none; }
    .booking-route { font-weight: 600; font-size: 0.9rem; color: #f0f0f5; margin-bottom: 4px; }
    .booking-info { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: rgba(255,255,255,0.4); }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .trip-meta { flex-wrap: wrap; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .scard { padding: 14px; }
      .scard-num { font-size: 1.4rem; }
    }
  `]
})
export class Dashboard implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private tripService = inject(TripService);
  private bookingService = inject(BookingService);
  private toast = inject(ToastService);

  isDriver = computed(() => false); // kept for template compatibility, always show unified view
  userName = signal('');
  trips = signal<any[]>([]);
  bookings = signal<any[]>([]);
  private refreshInterval: any;

  totalTrips = computed(() => this.trips().length);
  totalBookings = computed(() => this.bookings().length);
  pendingCount = computed(() => this.bookings().filter(b => b.status === 'PENDING').length);
  activeCount = computed(() => this.trips().filter(t => t.status === 'ACTIVE').length);
  activeTrips = computed(() => this.trips().filter(t => t.status === 'SCHEDULED' || t.status === 'ACTIVE'));

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: u => this.userName.set(u.name),
      error: () => this.toast.error('Failed to load profile')
    });
    this.refresh();
    this.refreshInterval = setInterval(() => this.refresh(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  refresh() {
    this.bookingService.getMyBookings().subscribe({
      next: b => this.bookings.set(b),
      error: () => this.toast.error('Failed to load bookings')
    });
    this.tripService.getMyTrips().subscribe({
      next: t => this.trips.set(t),
      error: () => this.toast.error('Failed to load trips')
    });
  }
}
