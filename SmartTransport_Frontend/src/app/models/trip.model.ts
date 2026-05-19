export interface Trip {
  id: number;
  driver: {
    id: number;
    name: string;
    email: string;
    gender: string;
    department: string;
  };
  vehicle: {
    id: number;
    licensePlate: string;
    model: string;
    color: string;
    totalSeats: number;
    approved: boolean;
  } | null;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  dailyRate: number;
  recurring: boolean;
  recurringDays: string;
  recurringGroupId: string | null;
  approvalMode: 'AUTO' | 'MANUAL';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  stops: TripStop[];
  createdAt: string;
}

export interface TripStop {
  id: number;
  stopName: string;
  lat: number;
  lng: number;
  stopOrder: number;
}

export interface TripRequest {
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number | null;
  dailyRate: number | null;
  recurring: boolean;
  recurringDays: string;
  approvalMode: string;
  vehicleId: number | null;
  stops: { stopName: string; lat: number | null; lng: number | null }[];
}

export interface TripSearchRequest {
  origin?: string;
  destination?: string;
  departureAfter?: string;
  departureBefore?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
}

