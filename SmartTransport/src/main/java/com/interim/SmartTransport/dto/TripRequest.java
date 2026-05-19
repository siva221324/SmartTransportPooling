package com.interim.SmartTransport.dto;

import com.interim.SmartTransport.model.enums.ApprovalMode;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TripRequest {
    @NotBlank
    private String origin;
    @NotBlank
    private String destination;
    private Double originLat;
    private Double originLng;
    private Double destLat;
    private Double destLng;
    @NotNull
    private LocalDateTime departureTime;
    @Min(1)
    private int availableSeats;
    private BigDecimal pricePerSeat;
    private BigDecimal dailyRate;
    private boolean recurring;
    private String recurringDays; // "MON,TUE,WED,THU,FRI"
    private ApprovalMode approvalMode;
    private Long vehicleId;
    private List<StopRequest> stops;

    @Data
    public static class StopRequest {
        private String stopName;
        private Double lat;
        private Double lng;
    }
}

