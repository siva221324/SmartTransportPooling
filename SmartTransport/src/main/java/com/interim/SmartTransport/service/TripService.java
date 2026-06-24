package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.TripRequest;
import com.interim.SmartTransport.dto.TripSearchRequest;
import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.TripStop;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.Vehicle;
import com.interim.SmartTransport.model.enums.ApprovalMode;
import com.interim.SmartTransport.model.enums.BookingStatus;
import com.interim.SmartTransport.model.enums.NotificationType;
import com.interim.SmartTransport.model.enums.TripStatus;
import com.interim.SmartTransport.repo.BookingRepository;
import com.interim.SmartTransport.repo.TripRepository;
import com.interim.SmartTransport.repo.UserRepository;
import com.interim.SmartTransport.repo.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Transactional
    public List<Trip> createTrip(String driverEmail, TripRequest request) {
        if (request.getDepartureTime() == null || request.getDepartureTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Departure time must be in the future");
        }

        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        Vehicle vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            if (!vehicle.getUser().getId().equals(driver.getId())) {
                throw new RuntimeException("This vehicle does not belong to you");
            }
            if (!vehicle.isApproved()) {
                throw new RuntimeException("Vehicle is not approved yet");
            }
        }

        List<Trip> trips = new ArrayList<>();

        if (request.isRecurring()) {
            if (request.getRecurringDays() == null || request.getRecurringDays().trim().isEmpty()) {
                throw new RuntimeException("Recurring trips require days to be specified (e.g. MON,TUE,WED)");
            }
            if (request.getDailyRate() == null) {
                throw new RuntimeException("Recurring trips require a daily rate");
            }
            // Expand recurring trips for the next 7 days matching the specified days
            String groupId = UUID.randomUUID().toString();
            String[] days = request.getRecurringDays().split(",");
            LocalDateTime base = request.getDepartureTime();
            for (int i = 0; i < 7; i++) {
                LocalDateTime date = base.plusDays(i);
                String dayName = date.getDayOfWeek().name().substring(0, 3); // MON, TUE...
                for (String d : days) {
                    if (d.trim().equalsIgnoreCase(dayName)) {
                        Trip t = buildTrip(driver, vehicle, request, date);
                        t.setRecurringGroupId(groupId);
                        trips.add(t);
                    }
                }
            }
            if (trips.isEmpty()) {
                throw new RuntimeException("No matching days found in the next 7 days for: " + request.getRecurringDays());
            }
        } else {
            if (request.getPricePerSeat() == null) {
                throw new RuntimeException("Non-recurring trips require a price per seat");
            }
            trips.add(buildTrip(driver, vehicle, request, request.getDepartureTime()));
        }

        List<Trip> savedTrips = tripRepository.saveAll(trips);

        // Save intermediate stops for each trip
        if (request.getStops() != null && !request.getStops().isEmpty()) {
            for (Trip savedTrip : savedTrips) {
                List<TripStop> stops = new ArrayList<>();
                for (int i = 0; i < request.getStops().size(); i++) {
                    TripRequest.StopRequest sr = request.getStops().get(i);
                    TripStop stop = TripStop.builder()
                            .trip(savedTrip)
                            .stopName(sr.getStopName())
                            .lat(sr.getLat())
                            .lng(sr.getLng())
                            .stopOrder(i + 1)
                            .build();
                    stops.add(stop);
                }
                savedTrip.getStops().addAll(stops);
            }
            tripRepository.saveAll(savedTrips);
        }

        return savedTrips;
    }

    private Trip buildTrip(User driver, Vehicle vehicle, TripRequest request, LocalDateTime departureTime) {
        return Trip.builder()
                .driver(driver)
                .vehicle(vehicle)
                .origin(request.getOrigin())
                .destination(request.getDestination())
                .originLat(request.getOriginLat())
                .originLng(request.getOriginLng())
                .destLat(request.getDestLat())
                .destLng(request.getDestLng())
                .departureTime(departureTime)
                .availableSeats(request.getAvailableSeats())
                .pricePerSeat(request.getPricePerSeat())
                .dailyRate(request.getDailyRate())
                .recurring(request.isRecurring())
                .recurringDays(request.getRecurringDays())
                .approvalMode(request.getApprovalMode() != null ? request.getApprovalMode() : ApprovalMode.MANUAL)
                .status(TripStatus.SCHEDULED)
                .build();
    }
    public List<Trip> searchTrips(TripSearchRequest request, String passengerEmail) {
        User passenger = userRepository.findByEmail(passengerEmail).orElseThrow();

        String origin = normalize(request.getOrigin());
        String destination = normalize(request.getDestination());
        String city = normalize(passenger.getCity());

        LocalDateTime departureAfter = request.getDepartureAfter() != null
                ? request.getDepartureAfter()
                : LocalDateTime.now();

        LocalDateTime departureBefore = request.getDepartureBefore() != null
                ? request.getDepartureBefore()
                : LocalDateTime.now().plusYears(10);

        BigDecimal minPrice = request.getMinPrice() != null
                ? request.getMinPrice()
                : BigDecimal.ZERO;

        BigDecimal maxPrice = request.getMaxPrice() != null
                ? request.getMaxPrice()
                : new BigDecimal("9999999");

        return tripRepository.searchTrips(
                origin,
                destination,
                departureAfter,
                departureBefore,
                minPrice,
                maxPrice,
                request.getGender(),
                city,
                passenger.getId()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
    public Trip getTrip(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
    }

    public List<Trip> getSiblingTrips(Long tripId) {
        Trip trip = getTrip(tripId);
        if (trip.getRecurringGroupId() == null) return List.of(trip);
        return tripRepository.findByRecurringGroupId(trip.getRecurringGroupId());
    }

    public List<String> getDistinctOrigins() {
        List<String> origins = new ArrayList<>(tripRepository.findDistinctOrigins());
        origins.addAll(tripRepository.findDistinctStopNames());
        return origins.stream().distinct().toList();
    }

    public List<String> getDistinctDestinations() {
        List<String> destinations = new ArrayList<>(tripRepository.findDistinctDestinations());
        destinations.addAll(tripRepository.findDistinctStopNames());
        return destinations.stream().distinct().toList();
    }

    public List<Trip> getDriverTrips(String driverEmail) {
        User driver = userRepository.findByEmail(driverEmail).orElseThrow();
        return tripRepository.findByDriverId(driver.getId());
    }

    @Transactional
    public Trip updateTrip(Long tripId, String driverEmail, TripRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("You can only edit your own trips");
        }

        if (trip.getDepartureTime().minusMinutes(30).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot modify trip less than 30 minutes before departure");
        }

        trip.setOrigin(request.getOrigin());
        trip.setDestination(request.getDestination());
        trip.setOriginLat(request.getOriginLat());
        trip.setOriginLng(request.getOriginLng());
        trip.setDestLat(request.getDestLat());
        trip.setDestLng(request.getDestLng());
        trip.setDepartureTime(request.getDepartureTime());
        trip.setAvailableSeats(request.getAvailableSeats());
        trip.setRecurring(request.isRecurring());
        trip.setRecurringDays(request.getRecurringDays());
        if (request.isRecurring()) {
            trip.setDailyRate(request.getDailyRate());
            trip.setPricePerSeat(null);
        } else {
            trip.setPricePerSeat(request.getPricePerSeat());
            trip.setDailyRate(null);
            trip.setRecurringDays(null);
        }
        if (request.getApprovalMode() != null) trip.setApprovalMode(request.getApprovalMode());

        return tripRepository.save(trip);
    }

    @Transactional
    public void cancelTrip(Long tripId, String driverEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("You can only cancel your own trips");
        }

        if (trip.getDepartureTime().minusMinutes(30).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel trip less than 30 minutes before departure");
        }

        trip.setStatus(TripStatus.CANCELLED);
        tripRepository.save(trip);

        // Notify all approved passengers
        notifyApprovedPassengers(trip, NotificationType.TRIP_CANCELLED,
                "Trip Cancelled",
                "The trip " + trip.getOrigin() + " \u2192 " + trip.getDestination() + " has been cancelled by the driver.");
    }

    @Transactional
    public Trip startTrip(Long tripId, String driverEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        if (!trip.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("You can only start your own trips");
        }
        if (trip.getStatus() != TripStatus.SCHEDULED) {
            throw new RuntimeException("Only SCHEDULED trips can be started");
        }
        trip.setStatus(TripStatus.ACTIVE);
        Trip saved = tripRepository.save(trip);

        notifyApprovedPassengers(trip, NotificationType.TRIP_STARTED,
                "Trip Started!",
                "Your trip " + trip.getOrigin() + " \u2192 " + trip.getDestination() + " has started. Track it live!");

        return saved;
    }

    @Transactional
    public Trip completeTrip(Long tripId, String driverEmail) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
        if (!trip.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("You can only complete your own trips");
        }
        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE trips can be completed");
        }
        trip.setStatus(TripStatus.COMPLETED);
        Trip saved = tripRepository.save(trip);

        notifyApprovedPassengers(trip, NotificationType.TRIP_COMPLETED,
                "Trip Completed",
                "Your trip " + trip.getOrigin() + " \u2192 " + trip.getDestination() + " is complete. Don't forget to rate the driver!");

        return saved;
    }

    private void notifyApprovedPassengers(Trip trip, NotificationType type, String title, String message) {
        List<Booking> approved = bookingRepository.findByTripIdAndStatus(trip.getId(), BookingStatus.APPROVED);
        for (Booking b : approved) {
            notificationService.notify(b.getPassenger(), type, title, message, trip.getId());
        }
    }
}

