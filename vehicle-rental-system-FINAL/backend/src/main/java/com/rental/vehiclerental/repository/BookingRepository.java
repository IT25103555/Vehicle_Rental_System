package com.rental.vehiclerental.repository;

import com.rental.vehiclerental.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByVehicleId(Long vehicleId);
    List<Booking> findByStatusIgnoreCase(String status);
}
