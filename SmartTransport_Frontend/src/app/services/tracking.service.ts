import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DriverLocation, LocationUpdate } from '../models/other.model';
import { WebSocketService } from './websocket.service';
import { environment } from '../environment';

const ACTIVE_TRIP_KEY = 'st_active_tracking_trip';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private apiUrl = `${environment.apiUrl}/tracking`;
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private watchId: number | null = null;

  updateLocation(update: LocationUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/location`, update);
  }

  getDriverLocation(driverId: number): Observable<DriverLocation> {
    return this.http.get<DriverLocation>(`${this.apiUrl}/location/${driverId}`);
  }

  /** Start broadcasting driver's GPS to the server */
  startGeoTracking(tripId: number): void {
    this.stopGeoTracking(); // clear any previous watch
    if (!navigator.geolocation) return;

    localStorage.setItem(ACTIVE_TRIP_KEY, String(tripId));
    this.ws.connect();

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const update: LocationUpdate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          tripId
        };
        // Send via WebSocket (fast)
        this.ws.sendLocation(update);
        // Also send via HTTP (reliable fallback)
        this.updateLocation(update).subscribe({ error: () => {} });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }

  /** Stop broadcasting */
  stopGeoTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    localStorage.removeItem(ACTIVE_TRIP_KEY);
  }

  /** Resume tracking if a trip was active (call on app init) */
  resumeIfActive(): void {
    const tripId = localStorage.getItem(ACTIVE_TRIP_KEY);
    if (tripId) {
      this.startGeoTracking(Number(tripId));
    }
  }

  /** Get the currently tracked trip ID, or null */
  get activeTripId(): number | null {
    const v = localStorage.getItem(ACTIVE_TRIP_KEY);
    return v ? Number(v) : null;
  }
}

