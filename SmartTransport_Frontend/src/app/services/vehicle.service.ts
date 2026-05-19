import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle, VehicleRequest } from '../models/vehicle.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  registerVehicle(req: VehicleRequest): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.apiUrl, req);
  }

  getMyVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/my`);
  }
}

