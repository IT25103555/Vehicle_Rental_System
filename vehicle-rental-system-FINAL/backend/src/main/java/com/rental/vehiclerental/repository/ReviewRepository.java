package com.rental.vehiclerental.repository;

import com.rental.vehiclerental.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByVehicleId(Long vehicleId);
    List<Review> findByCustomerId(Long customerId);
    boolean existsByBookingId(Long bookingId);
}
