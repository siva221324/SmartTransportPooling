package com.interim.SmartTransport.dto;

import lombok.Data;

@Data
public class LocationUpdate {
    private Double latitude;
    private Double longitude;
    private Long tripId;
}

