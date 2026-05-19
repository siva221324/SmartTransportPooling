package com.interim.SmartTransport.dto;

import lombok.Data;

@Data
public class BookingRequest {
    private int seats = 1;
    private String bookingType = "SINGLE";
    private String bookedDays;
}
