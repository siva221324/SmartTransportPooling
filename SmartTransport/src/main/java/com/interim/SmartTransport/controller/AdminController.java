package com.interim.SmartTransport.controller;

import com.interim.SmartTransport.dto.OrganizationRequest;
import com.interim.SmartTransport.model.Organization;
import com.interim.SmartTransport.model.Vehicle;
import com.interim.SmartTransport.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @PostMapping("/organizations")
    public ResponseEntity<Organization> createOrganization(@Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(adminService.createOrganization(request));
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(adminService.getAllOrganizations());
    }

    @PutMapping("/organizations/{id}")
    public ResponseEntity<Organization> updateOrganization(@PathVariable Long id,
                                                           @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(adminService.updateOrganization(id, request));
    }

    @DeleteMapping("/organizations/{id}")
    public ResponseEntity<Void> deleteOrganization(@PathVariable Long id) {
        adminService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vehicles/pending")
    public ResponseEntity<List<Vehicle>> getPendingVehicles() {
        return ResponseEntity.ok(adminService.getPendingVehicles());
    }

    @PutMapping("/vehicles/{id}/approve")
    public ResponseEntity<Vehicle> approveVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveVehicle(id));
    }
}

