import { Component, inject, OnInit, OnDestroy, signal, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TrackingService } from '../../services/tracking.service';
import { TripService } from '../../services/trip.service';
import { WebSocketService } from '../../services/websocket.service';
import { ToastService } from '../../services/toast.service';

declare const L: any;

@Component({
  selector: 'app-tracking',
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-broadcast me-2"></i>Live Tracking</h2>
      <p>Trip #{{ tripId }} — Real-time driver location</p>
    </div>

    @if (error) {
      <div class="alert alert-warning">{{ error }}</div>
    }

    @if (proximityAlert()) {
      <div class="alert alert-success alert-dismissible fade show">
        <i class="bi bi-bell-fill me-2"></i>
        <strong>Proximity Alert!</strong> {{ proximityAlert() }}
        <button type="button" class="btn-close" (click)="proximityAlert.set('')"></button>
      </div>
    }

    <div class="track-bar">
      <div class="track-route">
        <span class="rdot" style="background:#6c63ff"></span>
        <strong>{{ origin() }}</strong>
        <i class="bi bi-arrow-right" style="color:rgba(255,255,255,0.15)"></i>
        <span class="rdot" style="background:#e74c3c"></span>
        <strong>{{ destination() }}</strong>
      </div>
      <div>
        @if (lastUpdate()) {
          <small style="color:rgba(255,255,255,0.35)">Last update: {{ lastUpdate() }}</small>
        }
      </div>
      <div>
        @if (wsConnected()) {
          <span class="ws-chip live"><i class="bi bi-broadcast me-1"></i>Live</span>
        } @else {
          <span class="ws-chip poll"><i class="bi bi-arrow-repeat me-1"></i>Polling</span>
        }
      </div>
    </div>

    <div #mapContainer class="map-container" style="height: 500px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);"></div>
  `,
  styles: [`
    :host { display: block; }
    .pg-head { margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .track-bar {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px; padding: 14px 20px; margin-bottom: 16px;
    }
    .track-route { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #f0f0f5; }
    .rdot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .ws-chip { padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
    .ws-chip.live { background: rgba(46,204,113,0.12); color: #2ecc71; }
    .ws-chip.poll { background: rgba(241,196,15,0.12); color: #f1c40f; }
  `]
})
export class Tracking implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private trackingService = inject(TrackingService);
  private tripService = inject(TripService);
  private wsService = inject(WebSocketService);
  private toast = inject(ToastService);

  mapContainer = viewChild<ElementRef>('mapContainer');

  tripId = 0;
  driverId = 0;
  origin = signal('');
  destination = signal('');
  lastUpdate = signal('');
  proximityAlert = signal('');
  wsConnected = signal(false);
  error = '';

  private map: any;
  private marker: any;
  private interval: any;
  private wsSub: Subscription | null = null;
  private proxSub: Subscription | null = null;

  ngOnInit() {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));

    // Connect WebSocket
    this.wsService.connect();

    this.tripService.getTrip(this.tripId).subscribe({
      next: (trip) => {
        this.origin.set(trip.origin);
        this.destination.set(trip.destination);
        this.driverId = trip.driver.id;

        setTimeout(() => {
          const el = this.mapContainer()?.nativeElement;
          if (!el || typeof L === 'undefined') {
            this.error = 'Map library not loaded';
            return;
          }

          const lat = trip.originLat || 12.9716;
          const lng = trip.originLng || 77.5946;

          this.map = L.map(el).setView([lat, lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(this.map);

          if (trip.originLat && trip.originLng) {
            L.marker([trip.originLat, trip.originLng], {
              icon: L.divIcon({ html: '<i class="bi bi-geo-alt-fill text-primary" style="font-size:24px;"></i>', className: '' })
            }).addTo(this.map).bindPopup('Pickup: ' + trip.origin);
          }

          if (trip.destLat && trip.destLng) {
            L.marker([trip.destLat, trip.destLng], {
              icon: L.divIcon({ html: '<i class="bi bi-geo-alt-fill text-danger" style="font-size:24px;"></i>', className: '' })
            }).addTo(this.map).bindPopup('Drop: ' + trip.destination);
          }

          // Subscribe to WebSocket location updates
          this.wsSub = this.wsService.subscribeToTripLocation(this.tripId).subscribe(loc => {
            this.wsConnected.set(true);
            this.updateMarker(loc.latitude, loc.longitude);
          });

          // Subscribe to proximity alerts
          this.proxSub = this.wsService.subscribeToProximityAlerts(this.tripId).subscribe(alert => {
            this.proximityAlert.set(`${alert.message} (~${alert.distanceMeters}m away)`);
          });

          // Also poll as fallback
          this.pollLocation();
          this.interval = setInterval(() => this.pollLocation(), 5000);
        }, 100);
      },
      error: () => {
        this.error = 'Failed to load trip details';
        this.toast.error('Failed to load trip details');
      }
    });
  }

  private updateMarker(lat: number, lng: number) {
    const pos: [number, number] = [lat, lng];
    if (this.marker) {
      this.marker.setLatLng(pos);
    } else {
      this.marker = L.marker(pos, {
        icon: L.divIcon({ html: '<i class="bi bi-car-front-fill text-success" style="font-size:28px;"></i>', className: '' })
      }).addTo(this.map).bindPopup('Driver Location');
    }
    this.map.panTo(pos);
    this.lastUpdate.set(new Date().toLocaleTimeString());
  }

  pollLocation() {
    if (!this.driverId) return;
    this.trackingService.getDriverLocation(this.driverId).subscribe({
      next: (loc) => {
        if (loc && loc.latitude && loc.longitude) {
          this.updateMarker(loc.latitude, loc.longitude);
        }
      },
      error: () => {}
    });
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.proxSub) this.proxSub.unsubscribe();
    this.wsService.disconnect();
    if (this.map) this.map.remove();
  }
}
