import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization, OrganizationRequest } from '../models/other.model';
import { Vehicle } from '../models/vehicle.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  createOrganization(req: OrganizationRequest): Observable<Organization> {
    return this.http.post<Organization>(`${this.apiUrl}/organizations`, req);
  }

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/organizations`);
  }

  updateOrganization(id: number, req: OrganizationRequest): Observable<Organization> {
    return this.http.put<Organization>(`${this.apiUrl}/organizations/${id}`, req);
  }

  deleteOrganization(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/${id}`);
  }

  getPendingVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles/pending`);
  }

  approveVehicle(id: number): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/vehicles/${id}/approve`, {});
  }

  getStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats`);
  }
}

