package com.interim.SmartTransport.dto;

import com.interim.SmartTransport.model.enums.Gender;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TripSearchRequest {
    private String origin;
    private String destination;
    private LocalDateTime departureAfter;
    private LocalDateTime departureBefore;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Gender gender; // for same-gender filtering
}

