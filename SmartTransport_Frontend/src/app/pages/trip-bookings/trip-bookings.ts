import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { TripService } from '../../services/trip.service';
import { Booking } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-trip-bookings',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="pg-head">
      <div>
        <h2><i class="bi bi-people-fill me-2"></i>Trip Bookings</h2>
        <p>
          Manage booking requests for Trip #{{ tripId }}
          @if (trip()?.recurring) {
            <span class="recur-tag ms-1"><i class="bi bi-arrow-repeat"></i> {{ trip()!.departureTime | date:'EEE, MMM d' }}</span>
          }
        </p>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <span class="count-chip warn"><i class="bi bi-hourglass me-1"></i>{{ pendingCount() }} Pending</span>
        <span class="count-chip ok"><i class="bi bi-check me-1"></i>{{ approvedCount() }} Approved</span>
        <button class="refresh-btn" (click)="load()"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>

    <!-- Sibling trip navigation -->
    @if (siblingTrips().length > 1) {
      <div class="sib-nav">
        <small>Days:</small>
        @for (s of siblingTrips(); track s.id) {
          <a [routerLink]="['/trip-bookings', s.id]" class="sib-badge"
             [class.current]="s.id === tripId">
            {{ s.departureTime | date:'EEE, MMM d' }}
          </a>
        }
      </div>
    }

    @if (loading()) {
      <div class="loading-state"><div class="spinner-border" style="color:#6c63ff"></div></div>
    } @else if (bookings().length === 0) {
      <div class="empty-state">
        <i class="bi bi-people"></i>
        <h5>No booking requests yet</h5>
        <p>Passengers haven't requested to join this trip</p>
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Booked At</th>
              <th>Type</th>
              <th>Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (b of bookings(); track b.id) {
              <tr [class.pending-row]="b.status === 'PENDING'">
                <td>
                  <div class="pax-cell">
                    <div class="pax-av"><i class="bi bi-person"></i></div>
                    <div>
                      <strong>{{ b.passenger.name }}</strong>
                      <small class="d-block" style="color:rgba(255,255,255,0.3)">{{ b.passenger.email }}</small>
                    </div>
                  </div>
                </td>
                <td><span style="color:rgba(255,255,255,0.5);font-size:0.85rem">{{ b.bookedAt | date:'medium' }}</span></td>
                <td>
                  @if (b.bookingType === 'RECURRING') {
                    <span class="type-chip recur"><i class="bi bi-arrow-repeat me-1"></i>All Days</span>
                  } @else {
                    <span class="type-chip single">Single</span>
                  }
                </td>
                <td>
                  <span style="color:#2ecc71;font-weight:700">₹{{ b.fare }}</span>
                  @if (b.seatsBooked > 1) { <small style="color:rgba(255,255,255,0.3)"> ({{ b.seatsBooked }} seats)</small> }
                </td>
                <td><span class="badge-status badge-{{ b.status.toLowerCase() }}">{{ b.status }}</span></td>
                <td>
                  @if (b.status === 'PENDING') {
                    <div class="d-flex gap-1">
                      <button class="tbl-btn go" (click)="approve(b.id)"><i class="bi bi-check-lg"></i></button>
                      <button class="tbl-btn danger" (click)="reject(b.id)"><i class="bi bi-x-lg"></i></button>
                    </div>
                  } @else {
                    <span style="color:rgba(255,255,255,0.2)">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .recur-tag { font-size: 0.75rem; color: #3498db; font-weight: 600; }
    .count-chip { padding: 5px 12px; border-radius: 50px; font-size: 0.78rem; font-weight: 600; }
    .count-chip.warn { background: rgba(241,196,15,0.12); color: #f1c40f; }
    .count-chip.ok { background: rgba(46,204,113,0.12); color: #2ecc71; }
    .refresh-btn {
      width: 38px; height: 38px; border-radius: 10px;
      background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.2);
      color: #8f88ff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .refresh-btn:hover { background: rgba(108,99,255,0.2); }

    .sib-nav { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 20px; }
    .sib-nav small { color: rgba(255,255,255,0.3); margin-right: 4px; }
    .sib-badge {
      padding: 5px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 600;
      text-decoration: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
      border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s;
    }
    .sib-badge:hover { border-color: rgba(108,99,255,0.3); color: #8f88ff; }
    .sib-badge.current { background: linear-gradient(135deg, #6c63ff, #8f88ff); color: #fff; border-color: transparent; }

    .loading-state { text-align: center; padding: 60px; }
    .pending-row { background: rgba(241,196,15,0.03) !important; }

    .pax-cell { display: flex; align-items: center; gap: 10px; }
    .pax-av {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(108,99,255,0.15); color: #8f88ff;
      display: flex; align-items: center; justify-content: center;
    }
    .type-chip { padding: 3px 10px; border-radius: 50px; font-size: 0.72rem; font-weight: 600; }
    .type-chip.recur { background: rgba(52,152,219,0.12); color: #3498db; }
    .type-chip.single { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }

    .tbl-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; font-size: 0.85rem;
    }
    .tbl-btn.go { background: rgba(46,204,113,0.15); color: #2ecc71; }
    .tbl-btn.go:hover { background: #2ecc71; color: #fff; }
    .tbl-btn.danger { background: rgba(231,76,60,0.12); color: #e74c3c; }
    .tbl-btn.danger:hover { background: #e74c3c; color: #fff; }
  `]
})
export class TripBookings implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private tripService = inject(TripService);
  private toast = inject(ToastService);

  tripId = 0;
  trip = signal<Trip | null>(null);
  siblingTrips = signal<Trip[]>([]);
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  private refreshInterval: any;

  pendingCount = () => this.bookings().filter(b => b.status === 'PENDING').length;
  approvedCount = () => this.bookings().filter(b => b.status === 'APPROVED').length;

  ngOnInit() {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));
    this.tripService.getTrip(this.tripId).subscribe(t => {
      this.trip.set(t);
      if (t.recurring && t.recurringGroupId) {
        this.tripService.getSiblingTrips(this.tripId).subscribe({
          next: siblings => this.siblingTrips.set(siblings.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())),
          error: () => {}
        });
      }
    });
    this.load();
    this.refreshInterval = setInterval(() => this.load(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  load() {
    this.bookingService.getTripBookings(this.tripId).subscribe({
      next: (b) => { this.bookings.set(b); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load bookings'); }
    });
  }

  approve(id: number) {
    this.bookingService.approveBooking(id).subscribe({
      next: () => { this.toast.success('Booking approved! Seat reserved.'); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to approve')
    });
  }

  reject(id: number) {
    if (confirm('Reject this booking request?')) {
      this.bookingService.rejectBooking(id).subscribe({
        next: () => { this.toast.warning('Booking rejected.'); this.load(); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to reject')
      });
    }
  }
}
