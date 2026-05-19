import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, TripRequest, TripSearchRequest } from '../models/trip.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class TripService {
  private apiUrl = `${environment.apiUrl}/trips`;

  constructor(private http: HttpClient) {}

  createTrip(req: TripRequest): Observable<Trip[]> {
    return this.http.post<Trip[]>(this.apiUrl, req);
  }

  searchTrips(req: TripSearchRequest): Observable<Trip[]> {
    let params = new HttpParams();
    if (req.origin) params = params.set('origin', req.origin);
    if (req.destination) params = params.set('destination', req.destination);
    if (req.departureAfter) params = params.set('departureAfter', req.departureAfter);
    if (req.departureBefore) params = params.set('departureBefore', req.departureBefore);
    if (req.minPrice) params = params.set('minPrice', req.minPrice.toString());
    if (req.maxPrice) params = params.set('maxPrice', req.maxPrice.toString());
    if (req.gender) params = params.set('gender', req.gender);
    return this.http.get<Trip[]>(`${this.apiUrl}/search`, { params });
  }

  getTrip(id: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  getMyTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/my`);
  }

  updateTrip(id: number, req: TripRequest): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}`, req);
  }

  cancelTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  startTrip(id: number): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}/start`, {});
  }

  completeTrip(id: number): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}/complete`, {});
  }

  getOrigins(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/locations/origins`);
  }

  getDestinations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/locations/destinations`);
  }

  getSiblingTrips(id: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/${id}/siblings`);
  }
}

