export interface Vehicle {
  id: number;
  user: { id: number; name: string; email: string };
  licensePlate: string;
  model: string;
  color: string;
  totalSeats: number;
  licenseDocUrl: string;
  approved: boolean;
}

export interface VehicleRequest {
  licensePlate: string;
  model: string;
  color: string;
  totalSeats: number;
  licenseDocUrl: string;
}

