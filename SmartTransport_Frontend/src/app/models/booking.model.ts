export interface Booking {
  id: number;
  trip: {
    id: number;
    origin: string;
    destination: string;
    departureTime: string;
    pricePerSeat: number;
    dailyRate: number;
    recurring: boolean;
    recurringDays: string;
    recurringGroupId: string | null;
    driver: {
      id: number;
      name: string;
      email: string;
    };
  };
  passenger: {
    id: number;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  seatsBooked: number;
  bookingType: 'SINGLE' | 'RECURRING';
  bookedDays: string | null;
  fare: number;
  bookedAt: string;
}

