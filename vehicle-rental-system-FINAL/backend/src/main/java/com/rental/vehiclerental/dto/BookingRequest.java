package com.rental.vehiclerental.dto;

import java.time.LocalDate;

public class BookingRequest {
    public Long vehicleId;
    public Long customerId;
    public LocalDate startDate;
    public LocalDate endDate;
}
