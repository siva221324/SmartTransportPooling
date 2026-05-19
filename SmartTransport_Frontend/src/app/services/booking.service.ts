import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  requestBooking(tripId: number, seats: number = 1, bookingType: string = 'SINGLE', bookedDays?: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${tripId}`, { seats, bookingType, bookedDays: bookedDays || null });
  }

  approveBooking(id: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectBooking(id: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/reject`, {});
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/my`);
  }

  getTripBookings(tripId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/trip/${tripId}`);
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/cancel`, {});
  }
}

