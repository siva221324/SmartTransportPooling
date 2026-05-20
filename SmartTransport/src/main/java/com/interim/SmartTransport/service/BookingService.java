package com.interim.SmartTransport.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.enums.ApprovalMode;
import com.interim.SmartTransport.model.enums.BookingStatus;
import com.interim.SmartTransport.model.enums.BookingType;
import com.interim.SmartTransport.model.enums.NotificationType;
import com.interim.SmartTransport.repo.BookingRepository;
import com.interim.SmartTransport.repo.TripRepository;
import com.interim.SmartTransport.repo.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public Booking requestBooking(Long tripId, String passengerEmail, int seatsRequested, String bookingTypeStr, String bookedDays) {
        User passenger = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (seatsRequested < 1) seatsRequested = 1;

        if (trip.getDepartureTime().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Cannot book a trip that has already departed");
        }

        BookingType bookingType = BookingType.SINGLE;
        try { bookingType = BookingType.valueOf(bookingTypeStr); } catch (Exception ignored) {}

        // RECURRING booking: book across ALL sibling trips in the group
        if (bookingType == BookingType.RECURRING && trip.getRecurringGroupId() != null) {
            List<Trip> siblings = tripRepository.findByRecurringGroupId(trip.getRecurringGroupId());
            List<Booking> created = new ArrayList<>();

            for (Trip sibling : siblings) {
                // Skip if already booked on this sibling
                if (bookingRepository.existsByTripIdAndPassengerIdAndStatusNot(sibling.getId(), passenger.getId(), BookingStatus.CANCELLED)) {
                    continue;
                }
                // Skip if no seats
                if (sibling.getAvailableSeats() < seatsRequested) {
                    continue;
                }

                BookingStatus initialStatus = sibling.getApprovalMode() == ApprovalMode.AUTO
                        ? BookingStatus.APPROVED : BookingStatus.PENDING;

                java.math.BigDecimal fare = sibling.getDailyRate() != null
                        ? sibling.getDailyRate().multiply(java.math.BigDecimal.valueOf(seatsRequested))
                        : java.math.BigDecimal.ZERO;

                Booking booking = Booking.builder()
                        .trip(sibling)
                        .passenger(passenger)
                        .status(initialStatus)
                        .seatsBooked(seatsRequested)
                        .bookingType(BookingType.RECURRING)
                        .bookedDays(trip.getRecurringDays())
                        .fare(fare)
                        .build();

                if (initialStatus == BookingStatus.APPROVED) {
                    sibling.setAvailableSeats(sibling.getAvailableSeats() - seatsRequested);
                    tripRepository.save(sibling);
                }

                created.add(bookingRepository.save(booking));
            }

            if (created.isEmpty()) {
                throw new RuntimeException("Could not book any days — you may already have bookings on all days");
            }

            // Notify driver once
            notificationService.notify(trip.getDriver(), NotificationType.BOOKING_REQUESTED,
                    "Recurring Booking Request",
                    passenger.getName() + " requested " + seatsRequested + " seat(s) on all " + created.size() + " days of your recurring trip " + trip.getOrigin() + " → " + trip.getDestination(),
                    trip.getId());

            // Return the booking for the trip the passenger was viewing
            return created.stream().filter(b -> b.getTrip().getId().equals(tripId)).findFirst().orElse(created.get(0));
        }

        // SINGLE booking: book just this one trip
        if (trip.getAvailableSeats() < seatsRequested) {
            throw new RuntimeException("Not enough seats available (" + trip.getAvailableSeats() + " left)");
        }

        if (bookingRepository.existsByTripIdAndPassengerIdAndStatusNot(tripId, passenger.getId(), BookingStatus.CANCELLED)) {
            throw new RuntimeException("You already have a booking for this trip");
        }

        BookingStatus initialStatus = trip.getApprovalMode() == ApprovalMode.AUTO
                ? BookingStatus.APPROVED : BookingStatus.PENDING;

        java.math.BigDecimal fare;
        if (trip.isRecurring() && trip.getDailyRate() != null) {
            fare = trip.getDailyRate().multiply(java.math.BigDecimal.valueOf(seatsRequested));
        } else if (trip.getPricePerSeat() != null) {
            fare = trip.getPricePerSeat().multiply(java.math.BigDecimal.valueOf(seatsRequested));
        } else {
            throw new RuntimeException("Trip has no pricing configured");
        }

        Booking booking = Booking.builder()
                .trip(trip)
                .passenger(passenger)
                .status(initialStatus)
                .seatsBooked(seatsRequested)
                .bookingType(BookingType.SINGLE)
                .fare(fare)
                .build();

        if (initialStatus == BookingStatus.APPROVED) {
            trip.setAvailableSeats(trip.getAvailableSeats() - seatsRequested);
            tripRepository.save(trip);
        }

        Booking saved = bookingRepository.save(booking);

        notificationService.notify(trip.getDriver(), NotificationType.BOOKING_REQUESTED,
                "New Booking Request",
                passenger.getName() + " requested " + seatsRequested + " seat(s) on your trip " + trip.getOrigin() + " → " + trip.getDestination(),
                trip.getId());

        return saved;
    }

    @Transactional
    public Booking approveBooking(Long bookingId, String driverEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getTrip().getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("Only the trip driver can approve bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking is not in PENDING status");
        }

        Trip trip = booking.getTrip();
        if (trip.getAvailableSeats() < booking.getSeatsBooked()) {
            throw new RuntimeException("Not enough seats available");
        }

        booking.setStatus(BookingStatus.APPROVED);
        trip.setAvailableSeats(trip.getAvailableSeats() - booking.getSeatsBooked());
        tripRepository.save(trip);
        Booking saved = bookingRepository.save(booking);

        notificationService.notify(booking.getPassenger(), NotificationType.BOOKING_APPROVED,
                "Booking Approved!",
                "Your booking for " + trip.getOrigin() + " → " + trip.getDestination() + " has been approved.",
                trip.getId());

        emailService.sendBookingApprovedEmail(booking.getPassenger().getEmail(), trip.getOrigin(), trip.getDestination());

        return saved;
    }

    @Transactional
    public Booking rejectBooking(Long bookingId, String driverEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getTrip().getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("Only the trip driver can reject bookings");
        }

        booking.setStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        notificationService.notify(booking.getPassenger(), NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                "Your booking for " + booking.getTrip().getOrigin() + " → " + booking.getTrip().getDestination() + " was rejected by the driver.",
                booking.getTrip().getId());

        emailService.sendBookingRejectedEmail(booking.getPassenger().getEmail(), booking.getTrip().getOrigin(), booking.getTrip().getDestination());

        return saved;
    }

    public List<Booking> getPassengerBookings(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return bookingRepository.findByPassengerId(user.getId());
    }

    public List<Booking> getTripBookings(Long tripId) {
        return bookingRepository.findByTripId(tripId);
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, String passengerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getPassenger().getEmail().equals(passengerEmail)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        // If was approved, restore the seats
        if (booking.getStatus() == BookingStatus.APPROVED) {
            Trip trip = booking.getTrip();
            trip.setAvailableSeats(trip.getAvailableSeats() + booking.getSeatsBooked());
            tripRepository.save(trip);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
}

