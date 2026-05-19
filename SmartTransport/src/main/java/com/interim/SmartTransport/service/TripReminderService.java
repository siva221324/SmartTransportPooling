package com.interim.SmartTransport.service;

import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.enums.BookingStatus;
import com.interim.SmartTransport.model.enums.NotificationType;
import com.interim.SmartTransport.model.enums.TripStatus;
import com.interim.SmartTransport.repo.BookingRepository;
import com.interim.SmartTransport.repo.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripReminderService {

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    // Run every 15 minutes
    @Scheduled(fixedRate = 900000)
    public void sendTripReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourLater = now.plusHours(1);

        // Find trips departing in the next hour that are still SCHEDULED
        List<Trip> upcomingTrips = tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == TripStatus.SCHEDULED)
                .filter(t -> t.getDepartureTime().isAfter(now) && t.getDepartureTime().isBefore(oneHourLater))
                .toList();

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d, h:mm a");

        for (Trip trip : upcomingTrips) {
            List<Booking> approved = bookingRepository.findByTripIdAndStatus(trip.getId(), BookingStatus.APPROVED);
            String departure = trip.getDepartureTime().format(fmt);

            // Notify driver
            notificationService.notify(trip.getDriver(), NotificationType.TRIP_REMINDER,
                    "Trip Reminder",
                    "Your trip " + trip.getOrigin() + " → " + trip.getDestination() + " departs at " + departure,
                    trip.getId());

            // Notify each approved passenger
            for (Booking b : approved) {
                notificationService.notify(b.getPassenger(), NotificationType.TRIP_REMINDER,
                        "Trip Reminder",
                        "Your trip " + trip.getOrigin() + " → " + trip.getDestination() + " departs at " + departure,
                        trip.getId());
                emailService.sendTripReminderEmail(b.getPassenger().getEmail(),
                        trip.getOrigin(), trip.getDestination(), departure);
            }

            log.info("Sent reminders for trip {} ({} passengers)", trip.getId(), approved.size());
        }
    }
}
