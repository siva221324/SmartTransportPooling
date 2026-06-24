package com.interim.SmartTransport.repo;

import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByDriverId(Long driverId);

    List<Trip> findByStatus(TripStatus status);

    List<Trip> findByRecurringGroupId(String recurringGroupId);

    @Query("SELECT DISTINCT t.origin FROM Trip t WHERE t.status = 'SCHEDULED' AND t.availableSeats > 0 AND t.departureTime > CURRENT_TIMESTAMP")
    List<String> findDistinctOrigins();

    @Query("SELECT DISTINCT t.destination FROM Trip t WHERE t.status = 'SCHEDULED' AND t.availableSeats > 0 AND t.departureTime > CURRENT_TIMESTAMP")
    List<String> findDistinctDestinations();

    @Query("SELECT DISTINCT s.stopName FROM TripStop s JOIN s.trip t WHERE t.status = 'SCHEDULED' AND t.availableSeats > 0 AND t.departureTime > CURRENT_TIMESTAMP")
    List<String> findDistinctStopNames();

    @Query("""
SELECT t FROM Trip t
WHERE t.status = 'SCHEDULED'
AND t.departureTime > CURRENT_TIMESTAMP

AND (
    :origin IS NULL
    OR LOWER(t.origin) LIKE LOWER(CONCAT('%', CAST(:origin AS string), '%'))
    OR EXISTS (
        SELECT 1 FROM TripStop s
        WHERE s.trip = t
        AND LOWER(s.stopName) LIKE LOWER(CONCAT('%', CAST(:origin AS string), '%'))
    )
)

AND (
    :destination IS NULL
    OR LOWER(t.destination) LIKE LOWER(CONCAT('%', CAST(:destination AS string), '%'))
    OR EXISTS (
        SELECT 1 FROM TripStop s2
        WHERE s2.trip = t
        AND LOWER(s2.stopName) LIKE LOWER(CONCAT('%', CAST(:destination AS string), '%'))
    )
)

AND (:departureAfter IS NULL OR t.departureTime >= :departureAfter)
AND (:departureBefore IS NULL OR t.departureTime <= :departureBefore)
AND (:maxPrice IS NULL OR t.pricePerSeat <= :maxPrice OR t.dailyRate <= :maxPrice)
AND (:minPrice IS NULL OR t.pricePerSeat >= :minPrice OR t.dailyRate >= :minPrice)
AND (:gender IS NULL OR t.driver.gender = :gender)
AND (:city IS NULL OR t.driver.city = :city)
AND t.driver.id <> :excludeDriverId
AND t.availableSeats > 0
""")
    List<Trip> searchTrips(
            @Param("origin") String origin,
            @Param("destination") String destination,
            @Param("departureAfter") LocalDateTime departureAfter,
            @Param("departureBefore") LocalDateTime departureBefore,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("gender") com.interim.SmartTransport.model.enums.Gender gender,
            @Param("city") String city,
            @Param("excludeDriverId") Long excludeDriverId
    );
}

