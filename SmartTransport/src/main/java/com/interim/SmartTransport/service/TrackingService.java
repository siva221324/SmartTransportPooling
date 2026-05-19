package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.LocationUpdate;
import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.DriverLocation;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.enums.BookingStatus;
import com.interim.SmartTransport.repo.BookingRepository;
import com.interim.SmartTransport.repo.DriverLocationRepository;
import com.interim.SmartTransport.repo.TripRepository;
import com.interim.SmartTransport.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrackingService {

    private final DriverLocationRepository locationRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final double PROXIMITY_THRESHOLD_METERS = 500.0;

    public void updateLocation(String driverEmail, LocationUpdate update) {
        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        Optional<DriverLocation> existing = locationRepository.findTopByDriverIdOrderByUpdatedAtDesc(driver.getId());

        DriverLocation location = existing.orElse(DriverLocation.builder().driver(driver).build());
        location.setLatitude(update.getLatitude());
        location.setLongitude(update.getLongitude());
        locationRepository.save(location);

        // Broadcast to trip subscribers
        if (update.getTripId() != null) {
            messagingTemplate.convertAndSend("/topic/trip/" + update.getTripId() + "/location", update);

            // Check proximity for each passenger's pickup
            checkProximityAlerts(update.getTripId(), update.getLatitude(), update.getLongitude());
        }
    }

    public DriverLocation getLatestLocation(Long driverId) {
        return locationRepository.findTopByDriverIdOrderByUpdatedAtDesc(driverId)
                .orElseThrow(() -> new RuntimeException("No location data for driver"));
    }

    private void checkProximityAlerts(Long tripId, double driverLat, double driverLng) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null || trip.getOriginLat() == null || trip.getOriginLng() == null) return;

        double distance = haversine(driverLat, driverLng, trip.getOriginLat(), trip.getOriginLng());
        if (distance <= PROXIMITY_THRESHOLD_METERS) {
            List<Booking> approvedBookings = bookingRepository.findByTripIdAndStatus(tripId, BookingStatus.APPROVED);
            for (Booking booking : approvedBookings) {
                String destination = "/topic/trip/" + tripId + "/proximity";
                Object payload = Map.of("message", "Driver is within 500m of pickup point",
                        "distanceMeters", Math.round(distance),
                        "passengerId", booking.getPassenger().getId());
                messagingTemplate.convertAndSend(destination, payload);
            }
        }
    }

    /**
     * Haversine formula to calculate distance between two lat/lng points in meters.
     */
    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

