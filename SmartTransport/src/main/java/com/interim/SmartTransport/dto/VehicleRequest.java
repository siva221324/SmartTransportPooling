package com.interim.SmartTransport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank
    private String licensePlate;
    @NotBlank
    private String model;
    private String color;
    @NotNull
    private int totalSeats;
    private String licenseDocUrl;
}

