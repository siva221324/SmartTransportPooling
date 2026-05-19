package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.VehicleRequest;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.Vehicle;
import com.interim.SmartTransport.repo.UserRepository;
import com.interim.SmartTransport.repo.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public Vehicle registerVehicle(String driverEmail, VehicleRequest request) {
        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Vehicle vehicle = Vehicle.builder()
                .user(driver)
                .licensePlate(request.getLicensePlate())
                .model(request.getModel())
                .color(request.getColor())
                .totalSeats(request.getTotalSeats())
                .licenseDocUrl(request.getLicenseDocUrl())
                .approved(false)
                .build();

        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getDriverVehicles(String driverEmail) {
        User driver = userRepository.findByEmail(driverEmail).orElseThrow();
        return vehicleRepository.findByUserId(driver.getId());
    }
}

