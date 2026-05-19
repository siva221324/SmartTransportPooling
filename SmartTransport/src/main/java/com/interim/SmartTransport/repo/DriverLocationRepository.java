package com.interim.SmartTransport.repo;

import com.interim.SmartTransport.model.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, Long> {

    Optional<DriverLocation> findTopByDriverIdOrderByUpdatedAtDesc(Long driverId);
}

