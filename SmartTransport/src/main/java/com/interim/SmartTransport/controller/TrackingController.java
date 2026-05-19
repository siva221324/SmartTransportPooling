package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.LocationUpdate;
import com.interim.SmartTransport.model.DriverLocation;
import com.interim.SmartTransport.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PutMapping("/location")
    public ResponseEntity<Void> updateLocation(@AuthenticationPrincipal UserDetails userDetails,
                                               @RequestBody LocationUpdate update) {
        trackingService.updateLocation(userDetails.getUsername(), update);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/location/{driverId}")
    public ResponseEntity<DriverLocation> getLocation(@PathVariable Long driverId) {
        return ResponseEntity.ok(trackingService.getLatestLocation(driverId));
    }

    // WebSocket endpoint: driver sends location via STOMP
    @MessageMapping("/track")
    public void trackViaWebSocket(LocationUpdate update, Principal principal) {
        trackingService.updateLocation(principal.getName(), update);
    }
}

