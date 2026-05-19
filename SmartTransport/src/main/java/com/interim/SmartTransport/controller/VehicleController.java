package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.VehicleRequest;
import com.interim.SmartTransport.model.Vehicle;
import com.interim.SmartTransport.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping
    public ResponseEntity<Vehicle> registerVehicle(@AuthenticationPrincipal UserDetails userDetails,
                                                   @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.registerVehicle(userDetails.getUsername(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Vehicle>> getMyVehicles(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(vehicleService.getDriverVehicles(userDetails.getUsername()));
    }
}

