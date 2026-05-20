import { Component, inject, signal, ElementRef, viewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { TripRequest } from '../../models/trip.model';
import { VehicleService } from '../../services/vehicle.service';
import { Vehicle } from '../../models/vehicle.model';
import { ToastService } from '../../services/toast.service';

declare const L: any;

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: any;
  short?: string;
}

@Component({
  selector: 'app-create-trip',
  imports: [FormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-plus-circle-fill me-2"></i>Create Trip</h2>
      <p>Post a new ride for passengers</p>
    </div>

    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }
    @if (success()) {
      <div class="alert alert-success">Trip(s) created successfully!</div>
    }

    <div class="card p-4 mb-4">
      <!-- Search Bars + GPS -->
      <div class="row g-3 mb-3">
        <!-- Origin search -->
        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="bi bi-geo-alt text-primary me-1"></i>Pickup Location</label>
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-primary text-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control"
                     [value]="form.origin"
                     (input)="onOriginSearch($event)"
                     (focus)="originFocused.set(true)"
                     placeholder="Search pickup location..."
                     autocomplete="off">
              <button type="button" class="btn btn-outline-primary" (click)="detectMyLocation('origin')"
                      [disabled]="gpsLoading()" title="Use my current location">
                @if (gpsLoading() && gpsTarget() === 'origin') {
                  <span class="spinner-border spinner-border-sm"></span>
                } @else {
                  <i class="bi bi-crosshair"></i>
                }
              </button>
            </div>
            @if (originFocused() && originSuggestions().length > 0) {
              <div class="suggestions-dropdown">
                @for (s of originSuggestions(); track s.display_name) {
                  <div class="suggestion-item" (mousedown)="selectSuggestion(s, 'origin')">
                    <i class="bi bi-geo-alt text-primary me-2"></i>
                    <div>
                      <div class="suggestion-main">{{ s.short }}</div>
                      <small class="text-muted suggestion-detail">{{ s.display_name }}</small>
                    </div>
                  </div>
                }
              </div>
            }
            @if (form.originLat) {
              <small class="text-success mt-1 d-block">
                <i class="bi bi-check-circle me-1"></i>{{ form.origin }}
                <span class="text-muted">({{ form.originLat | number:'1.4-4' }}, {{ form.originLng | number:'1.4-4' }})</span>
              </small>
            }
          </div>
        </div>

        <!-- Destination search -->
        <div class="col-md-6">
          <label class="form-label fw-bold"><i class="bi bi-geo-alt-fill text-danger me-1"></i>Drop-off Location</label>
          <div class="position-relative">
            <div class="input-group">
              <span class="input-group-text bg-danger text-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control"
                     [value]="form.destination"
                     (input)="onDestSearch($event)"
                     (focus)="destFocused.set(true)"
                     placeholder="Search drop-off location..."
                     autocomplete="off">
              <button type="button" class="btn btn-outline-danger" (click)="detectMyLocation('destination')"
                      [disabled]="gpsLoading()" title="Use my current location">
                @if (gpsLoading() && gpsTarget() === 'destination') {
                  <span class="spinner-border spinner-border-sm"></span>
                } @else {
                  <i class="bi bi-crosshair"></i>
                }
              </button>
            </div>
            @if (destFocused() && destSuggestions().length > 0) {
              <div class="suggestions-dropdown">
                @for (s of destSuggestions(); track s.display_name) {
                  <div class="suggestion-item" (mousedown)="selectSuggestion(s, 'destination')">
                    <i class="bi bi-geo-alt-fill text-danger me-2"></i>
                    <div>
                      <div class="suggestion-main">{{ s.short }}</div>
                      <small class="text-muted suggestion-detail">{{ s.display_name }}</small>
                    </div>
                  </div>
                }
              </div>
            }
            @if (form.destLat) {
              <small class="text-success mt-1 d-block">
                <i class="bi bi-check-circle me-1"></i>{{ form.destination }}
                <span class="text-muted">({{ form.destLat | number:'1.4-4' }}, {{ form.destLng | number:'1.4-4' }})</span>
              </small>
            }
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="mb-4">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge" [class]="form.originLat ? 'bg-primary' : 'bg-secondary'">
              <i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>Pickup
            </span>
            <i class="bi bi-three-dots"></i>
            <span class="badge" [class]="form.destLat ? 'bg-danger' : 'bg-secondary'">
              <i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>Drop-off
            </span>
          </div>
          <div class="d-flex gap-2">
            @if (form.originLat || form.destLat) {
              <button type="button" class="btn btn-outline-warning btn-sm" (click)="resetMarkers()">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            }
          </div>
        </div>
        <div class="map-pick-hint mb-2">
          @if (!form.originLat) {
            <small class="text-primary"><i class="bi bi-cursor me-1"></i>Search above or click the map to set <strong>Pickup</strong></small>
          } @else if (!form.destLat) {
            <small class="text-danger"><i class="bi bi-cursor me-1"></i>Search above or click the map to set <strong>Drop-off</strong></small>
          } @else {
            <small class="text-success"><i class="bi bi-check-circle me-1"></i>Route set! Drag markers to adjust or search again to change.</small>
          }
        </div>
        <div #mapContainer class="create-trip-map"></div>
      </div>

      <form (ngSubmit)="onCreate()">
        <!-- Vehicle Selection -->
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label fw-bold"><i class="bi bi-car-front me-1"></i>Vehicle</label>
            <select class="form-select" [(ngModel)]="form.vehicleId" name="vehicleId">
              <option [ngValue]="null">No vehicle selected</option>
              @for (v of approvedVehicles(); track v.id) {
                <option [ngValue]="v.id">{{ v.model }} — {{ v.licensePlate }} ({{ v.color }}, {{ v.totalSeats }} seats)</option>
              }
            </select>
            @if (approvedVehicles().length === 0) {
              <small class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i>No approved vehicles. <a routerLink="/my-vehicles" class="text-decoration-none">Register one</a></small>
            }
          </div>
        </div>

        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Departure Time</label>
            <input type="datetime-local" class="form-control" [(ngModel)]="form.departureTime" name="departureTime" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Available Seats</label>
            <input type="number" class="form-control" [(ngModel)]="form.availableSeats" name="availableSeats" min="1" required>
          </div>
          <div class="col-md-3">
            <label class="form-label">Price per Seat <span class="text-danger">*</span></label>
            <input type="number" class="form-control" [(ngModel)]="form.pricePerSeat" name="pricePerSeat" step="0.01" required>
          </div>

          <div class="col-md-4">
            <label class="form-label">Approval Mode</label>
            <select class="form-select" [(ngModel)]="form.approvalMode" name="approvalMode">
              <option value="MANUAL">Manual Review</option>
              <option value="AUTO">Auto-Accept</option>
            </select>
          </div>
        </div>

        <!-- Intermediate Stops -->
        <div class="row g-3 mt-3">
          <div class="col-12">
            <label class="form-label fw-bold"><i class="bi bi-signpost-split me-1"></i>Intermediate Stops <small class="text-muted fw-normal">(optional — places you pass through)</small></label>
            @for (stop of form.stops; track $index) {
              <div class="d-flex gap-2 align-items-center mb-2">
                <span class="badge bg-secondary">{{ $index + 1 }}</span>
                <input type="text" class="form-control" [(ngModel)]="stop.stopName" [name]="'stop_' + $index"
                       placeholder="e.g. Salem, Vellore, Hosur...">
                <button type="button" class="btn btn-outline-danger btn-sm" (click)="removeStop($index)" title="Remove">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            }
            <button type="button" class="btn btn-outline-primary btn-sm" (click)="addStop()">
              <i class="bi bi-plus-circle me-1"></i> Add Stop
            </button>
          </div>
        </div>

        <div class="mt-4">
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading() || !form.originLat || !form.destLat">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            <i class="bi bi-check-lg me-1"></i> Create Trip
          </button>
          @if (!form.originLat || !form.destLat) {
            <small class="text-muted ms-3"><i class="bi bi-info-circle me-1"></i>Set both locations to continue</small>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pg-head { margin-bottom: 20px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }
    .pg-head p { color: rgba(255,255,255,0.4); margin: 4px 0 0; }
    .create-trip-map { height: 420px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); z-index: 0; cursor: crosshair !important; }
    .suggestions-dropdown {
      position: absolute; top: 100%; left: 0; right: 0;
      background: #1c1c2e; border: 1px solid rgba(255,255,255,0.08);
      border-top: none; border-radius: 0 0 10px 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 1050; max-height: 260px; overflow-y: auto;
    }
    .suggestion-item { display: flex; align-items: flex-start; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; color: #f0f0f5; }
    .suggestion-item:hover { background: rgba(108,99,255,0.08); }
    .suggestion-item:last-child { border-bottom: none; }
    .suggestion-main { font-weight: 500; font-size: 0.95rem; }
    .suggestion-detail { font-size: 0.78rem; color: rgba(255,255,255,0.35); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .badge { font-size: 0.82rem; padding: 5px 10px; }
    .map-pick-hint { min-height: 22px; }
  `]
})
export class CreateTrip implements AfterViewInit, OnDestroy {
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private router = inject(Router);
  private toast = inject(ToastService);

  mapContainer = viewChild<ElementRef>('mapContainer');

  approvedVehicles = signal<Vehicle[]>([]);

  form: TripRequest = {
    origin: '', destination: '', originLat: null, originLng: null, destLat: null, destLng: null,
    departureTime: '', availableSeats: 1, pricePerSeat: null, dailyRate: null,
    recurring: false, recurringDays: '', approvalMode: 'MANUAL', vehicleId: null, stops: []
  };

  loading = signal(false);
  pickingMode = signal<'origin' | 'destination' | 'done'>('origin');

  // Search suggestions
  originSuggestions = signal<PlaceSuggestion[]>([]);
  destSuggestions = signal<PlaceSuggestion[]>([]);
  originFocused = signal(false);
  destFocused = signal(false);

  // GPS
  gpsLoading = signal(false);
  gpsTarget = signal<'origin' | 'destination' | ''>('');

  error = signal('');
  success = signal(false);

  addStop() {
    this.form.stops.push({ stopName: '', lat: null, lng: null });
  }

  removeStop(index: number) {
    this.form.stops.splice(index, 1);
  }

  private map: any;
  private originMarker: any;
  private destMarker: any;
  private routeLine: any;
  private currentLocMarker: any;
  private originSearchTimer: any;
  private destSearchTimer: any;

  private outsideClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.position-relative')) {
      this.originFocused.set(false);
      this.destFocused.set(false);
    }
  };

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
    document.addEventListener('click', this.outsideClickHandler);
    this.vehicleService.getMyVehicles().subscribe({
      next: v => this.approvedVehicles.set(v.filter(x => x.approved)),
      error: () => {}
    });
  }

  private initMap() {
    const el = this.mapContainer()?.nativeElement;
    if (!el || typeof L === 'undefined') return;

    this.map = L.map(el).setView([12.9716, 77.5946], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Auto-detect current location and show pulsing marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.map.setView([lat, lng], 14);
          this.currentLocMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: '<div class="current-loc-pulse"><div class="pulse-dot"></div><div class="pulse-ring"></div></div>',
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(this.map).bindPopup('<strong>You are here</strong>');
        },
        () => {}
      );
    }

    this.map.on('click', (e: any) => this.handleMapClick(e));
    this.addPulseStyles();
  }

  private addPulseStyles() {
    if (document.getElementById('pulse-style')) return;
    const style = document.createElement('style');
    style.id = 'pulse-style';
    style.textContent = [
      '.current-loc-pulse { position: relative; width: 20px; height: 20px; }',
      '.pulse-dot { position: absolute; top: 6px; left: 6px; width: 8px; height: 8px; background: #4285f4; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 4px rgba(66,133,244,0.5); z-index: 2; }',
      '.pulse-ring { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(66,133,244,0.25); animation: pulse-anim 2s ease-out infinite; }',
      '@keyframes pulse-anim { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Search autocomplete with debounce ──

  onOriginSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.form.origin = val;
    this.originFocused.set(true);
    clearTimeout(this.originSearchTimer);
    if (val.length < 3) { this.originSuggestions.set([]); return; }
    this.originSearchTimer = setTimeout(() => this.searchPlaces(val, 'origin'), 400);
  }

  onDestSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.form.destination = val;
    this.destFocused.set(true);
    clearTimeout(this.destSearchTimer);
    if (val.length < 3) { this.destSuggestions.set([]); return; }
    this.destSearchTimer = setTimeout(() => this.searchPlaces(val, 'destination'), 400);
  }

  private searchPlaces(query: string, target: 'origin' | 'destination') {
    const center = this.map?.getCenter();
    const lat = center?.lat || 12.9716;
    const lng = center?.lng || 77.5946;

    // Use Photon API (better autocomplete, finds shops/companies/landmarks)
    const photonUrl = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(query)
      + '&lat=' + lat + '&lon=' + lng
      + '&limit=6&lang=en';

    fetch(photonUrl)
      .then(res => res.json())
      .then((data: any) => {
        const features = data.features || [];
        // Filter to India results first, then allow others as fallback
        const indiaResults = features.filter((f: any) => f.properties?.country === 'India');
        const results = indiaResults.length >= 2 ? indiaResults : features;

        const suggestions: PlaceSuggestion[] = results.map((f: any) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const name = p.name || '';
          const street = p.street || '';
          const locality = p.locality || p.district || '';
          const city = p.city || p.county || p.state || '';

          // Build a short readable name
          const parts = [name, street, locality, city].filter(Boolean);
          const short = parts.slice(0, 2).join(', ') || p.label || '';
          const display = parts.join(', ') || p.label || '';

          return {
            display_name: display,
            lat: String(coords[1]),
            lon: String(coords[0]),
            address: p,
            short: short
          } as PlaceSuggestion;
        });
        if (target === 'origin') this.originSuggestions.set(suggestions);
        else this.destSuggestions.set(suggestions);
      })
      .catch(() => {
        // Fallback to Nominatim if Photon fails
        this.searchPlacesFallback(query, target, lat, lng);
      });
  }

  private searchPlacesFallback(query: string, target: 'origin' | 'destination', lat: number, lng: number) {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query)
      + '&format=json&addressdetails=1&limit=6&countrycodes=in'
      + '&viewbox=' + (lng - 0.3) + ',' + (lat + 0.3) + ',' + (lng + 0.3) + ',' + (lat - 0.3)
      + '&bounded=1';
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(res => res.json())
      .then((results: any[]) => {
        const suggestions: PlaceSuggestion[] = results.map(r => ({
          ...r,
          lat: r.lat,
          lon: r.lon,
          short: this.shortName(r.address, r.display_name)
        }));
        if (target === 'origin') this.originSuggestions.set(suggestions);
        else this.destSuggestions.set(suggestions);
      })
      .catch(() => {});
  }

  selectSuggestion(s: PlaceSuggestion, target: 'origin' | 'destination') {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    if (target === 'origin') {
      this.form.origin = s.short || s.display_name;
      this.originSuggestions.set([]);
      this.originFocused.set(false);
      this.setOrigin(lat, lng, false);
      if (!this.form.destLat) this.pickingMode.set('destination');
      else this.drawRoute();
    } else {
      this.form.destination = s.short || s.display_name;
      this.destSuggestions.set([]);
      this.destFocused.set(false);
      this.setDestination(lat, lng, false);
      if (this.form.originLat) this.drawRoute();
    }
    this.map.setView([lat, lng], 15, { animate: true });
  }

  // ── GPS detect location ──

  detectMyLocation(target: 'origin' | 'destination') {
    if (!navigator.geolocation) {
      this.toast.error('Geolocation is not supported by your browser');
      return;
    }
    this.gpsLoading.set(true);
    this.gpsTarget.set(target);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.map.setView([lat, lng], 15, { animate: true });
        if (target === 'origin') {
          this.setOrigin(lat, lng, true);
          if (!this.form.destLat) this.pickingMode.set('destination');
          else this.drawRoute();
        } else {
          this.setDestination(lat, lng, true);
          if (this.form.originLat) this.drawRoute();
        }
        this.gpsLoading.set(false);
        this.gpsTarget.set('');
        const label = target === 'origin' ? 'Pickup' : 'Drop-off';
        this.toast.success(label + ' set to your current location');
      },
      (err) => {
        this.gpsLoading.set(false);
        this.gpsTarget.set('');
        if (err.code === err.PERMISSION_DENIED) {
          this.toast.error('Location access denied. Please allow location in browser settings.');
        } else {
          this.toast.error('Could not detect your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Map click handler ──

  private handleMapClick(e: any) {
    const lat: number = e.latlng.lat;
    const lng: number = e.latlng.lng;

    if (!this.form.originLat) {
      this.setOrigin(lat, lng, true);
      this.pickingMode.set('destination');
    } else if (!this.form.destLat) {
      this.setDestination(lat, lng, true);
      this.pickingMode.set('done');
      this.drawRoute();
    }
  }

  // ── Marker management ──

  private setOrigin(lat: number, lng: number, geocode: boolean) {
    this.form.originLat = Math.round(lat * 1e6) / 1e6;
    this.form.originLng = Math.round(lng * 1e6) / 1e6;

    if (this.currentLocMarker) { this.map.removeLayer(this.currentLocMarker); this.currentLocMarker = null; }

    if (this.originMarker) {
      this.originMarker.setLatLng([lat, lng]);
    } else {
      this.originMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
          html: '<div style="background:#0d6efd;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="bi bi-geo-alt"></i></div>',
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        })
      }).addTo(this.map);

      this.originMarker.on('dragend', () => {
        const pos = this.originMarker.getLatLng();
        this.form.originLat = Math.round(pos.lat * 1e6) / 1e6;
        this.form.originLng = Math.round(pos.lng * 1e6) / 1e6;
        this.reverseGeocode(pos.lat, pos.lng, 'origin');
        this.drawRoute();
      });
    }
    this.originMarker.bindPopup('<strong>Pickup</strong>').openPopup();
    if (geocode) this.reverseGeocode(lat, lng, 'origin');
  }

  private setDestination(lat: number, lng: number, geocode: boolean) {
    this.form.destLat = Math.round(lat * 1e6) / 1e6;
    this.form.destLng = Math.round(lng * 1e6) / 1e6;

    if (this.destMarker) {
      this.destMarker.setLatLng([lat, lng]);
    } else {
      this.destMarker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
          html: '<div style="background:#dc3545;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="bi bi-geo-alt-fill"></i></div>',
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        })
      }).addTo(this.map);

      this.destMarker.on('dragend', () => {
        const pos = this.destMarker.getLatLng();
        this.form.destLat = Math.round(pos.lat * 1e6) / 1e6;
        this.form.destLng = Math.round(pos.lng * 1e6) / 1e6;
        this.reverseGeocode(pos.lat, pos.lng, 'destination');
        this.drawRoute();
      });
    }
    this.destMarker.bindPopup('<strong>Drop-off</strong>').openPopup();
    if (geocode) this.reverseGeocode(lat, lng, 'destination');
  }

  private drawRoute() {
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    if (this.form.originLat && this.form.destLat) {
      this.routeLine = L.polyline(
        [[this.form.originLat, this.form.originLng], [this.form.destLat, this.form.destLng]],
        { color: '#6f42c1', weight: 4, dashArray: '10, 8', opacity: 0.8 }
      ).addTo(this.map);

      this.map.fitBounds(L.latLngBounds(
        [this.form.originLat, this.form.originLng],
        [this.form.destLat, this.form.destLng]
      ), { padding: [60, 60] });
      this.pickingMode.set('done');
    }
  }

  private reverseGeocode(lat: number, lng: number, target: 'origin' | 'destination') {
    const url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&addressdetails=1';
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(res => res.json())
      .then(data => {
        if (data?.display_name) {
          const short = this.shortName(data.address, data.display_name);
          if (target === 'origin') {
            this.form.origin = short;
            this.originMarker?.setPopupContent('<strong>Pickup:</strong> ' + short);
          } else {
            this.form.destination = short;
            this.destMarker?.setPopupContent('<strong>Drop-off:</strong> ' + short);
          }
        }
      })
      .catch(() => {});
  }

  private shortName(addr: any, full: string): string {
    if (!addr) return full.split(',').slice(0, 2).join(', ').trim();
    return [
      addr.road || addr.neighbourhood || addr.suburb || addr.village || addr.town || '',
      addr.city || addr.state_district || addr.county || addr.state || ''
    ].filter(Boolean).join(', ') || full.split(',').slice(0, 2).join(', ').trim();
  }

  resetMarkers() {
    if (this.originMarker) { this.map.removeLayer(this.originMarker); this.originMarker = null; }
    if (this.destMarker) { this.map.removeLayer(this.destMarker); this.destMarker = null; }
    if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }
    this.form.origin = '';
    this.form.destination = '';
    this.form.originLat = null;
    this.form.originLng = null;
    this.form.destLat = null;
    this.form.destLng = null;
    this.pickingMode.set('origin');
    this.originSuggestions.set([]);
    this.destSuggestions.set([]);
  }

  onCreate() {
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);

    if (this.form.recurring) {
      if (!this.form.recurringDays || !this.form.recurringDays.trim()) {
        this.error.set('Recurring trips require at least one day (e.g. MON,TUE)');
        this.loading.set(false);
        return;
      }
      if (!this.form.dailyRate || this.form.dailyRate <= 0) {
        this.error.set('Recurring trips require a daily rate');
        this.loading.set(false);
        return;
      }
    } else {
      if (!this.form.pricePerSeat || this.form.pricePerSeat <= 0) {
        this.error.set('Please enter a price per seat');
        this.loading.set(false);
        return;
      }
    }

    this.tripService.createTrip(this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.toast.success('Trip(s) created successfully!');
        setTimeout(() => this.router.navigate(['/my-trips']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Failed to create trip';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.originSearchTimer);
    clearTimeout(this.destSearchTimer);
    document.removeEventListener('click', this.outsideClickHandler);
    if (this.map) this.map.remove();
  }
}

