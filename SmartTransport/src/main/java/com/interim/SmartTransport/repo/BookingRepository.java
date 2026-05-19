package com.interim.SmartTransport.repo;

import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByPassengerId(Long passengerId);

    List<Booking> findByTripId(Long tripId);

    List<Booking> findByPassengerIdAndStatus(Long passengerId, BookingStatus status);

    List<Booking> findByTripIdAndStatus(Long tripId, BookingStatus status);

    boolean existsByTripIdAndPassengerIdAndStatusNot(Long tripId, Long passengerId, BookingStatus status);
}

