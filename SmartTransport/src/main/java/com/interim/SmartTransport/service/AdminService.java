package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.OrganizationRequest;
import com.interim.SmartTransport.model.Organization;
import com.interim.SmartTransport.model.Vehicle;
import com.interim.SmartTransport.model.enums.TripStatus;
import com.interim.SmartTransport.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrganizationRepository organizationRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;

    // --- Organization CRUD ---

    public Organization createOrganization(OrganizationRequest request) {
        if (organizationRepository.findByEmailDomain(request.getEmailDomain()).isPresent()) {
            throw new RuntimeException("Domain already exists");
        }
        Organization org = Organization.builder()
                .name(request.getName())
                .emailDomain(request.getEmailDomain())
                .whitelisted(request.isWhitelisted())
                .build();
        return organizationRepository.save(org);
    }

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    public Organization updateOrganization(Long id, OrganizationRequest request) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        org.setName(request.getName());
        org.setEmailDomain(request.getEmailDomain());
        org.setWhitelisted(request.isWhitelisted());
        return organizationRepository.save(org);
    }

    public void deleteOrganization(Long id) {
        organizationRepository.deleteById(id);
    }

    // --- Vehicle approval ---

    public List<Vehicle> getPendingVehicles() {
        return vehicleRepository.findByApprovedFalse();
    }

    public Vehicle approveVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setApproved(true);
        return vehicleRepository.save(vehicle);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalTrips", tripRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("activeTrips", tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == TripStatus.ACTIVE).count());
        stats.put("pendingVehicles", vehicleRepository.findByApprovedFalse().size());
        stats.put("totalOrganizations", organizationRepository.count());
        return stats;
    }
}

