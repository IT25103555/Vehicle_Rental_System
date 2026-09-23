package com.rental.vehiclerental.controller;

import com.rental.vehiclerental.dto.ReviewRequest;
import com.rental.vehiclerental.model.Booking;
import com.rental.vehiclerental.model.Review;
import com.rental.vehiclerental.model.User;
import com.rental.vehiclerental.model.Vehicle;
import com.rental.vehiclerental.repository.BookingRepository;
import com.rental.vehiclerental.repository.ReviewRepository;
import com.rental.vehiclerental.repository.UserRepository;
import com.rental.vehiclerental.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Lets a customer leave feedback (rating + comment) about a vehicle they
 * actually rented, and lets admins view/moderate that feedback.
 * Matches the /reviews endpoints the frontend (my-bookings.js, admin.js)
 * already calls.
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookingRepository bookingRepository;

    // GET /api/reviews  (Admin: every review, for the moderation table)
    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    // GET /api/reviews/vehicle/{vehicleId}  (public: shown on a vehicle's page)
    @GetMapping("/vehicle/{vehicleId}")
    public List<Review> getReviewsForVehicle(@PathVariable Long vehicleId) {
        return reviewRepository.findByVehicleId(vehicleId);
    }

    // GET /api/reviews/customer/{customerId}  (a customer's own review history)
    @GetMapping("/customer/{customerId}")
    public List<Review> getReviewsByCustomer(@PathVariable Long customerId) {
        return reviewRepository.findByCustomerId(customerId);
    }

    // POST /api/reviews  (Create - Customer leaves a review about a vehicle they rented)
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest req) {
        Vehicle vehicle = vehicleRepository.findById(req.vehicleId).orElse(null);
        User customer = userRepository.findById(req.customerId).orElse(null);
        if (vehicle == null) return ResponseEntity.badRequest().body(Map.of("message", "Vehicle not found."));
        if (customer == null) return ResponseEntity.badRequest().body(Map.of("message", "Customer not found."));

        if (req.rating == null || req.rating < 1 || req.rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be between 1 and 5."));
        }

        Booking booking = null;
        if (req.bookingId != null) {
            booking = bookingRepository.findById(req.bookingId).orElse(null);
            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Booking not found."));
            }
            // Only allow a review for a booking that's actually complete, and only once per booking
            if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "You can only review a completed rental."));
            }
            if (reviewRepository.existsByBookingId(req.bookingId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "You've already reviewed this booking."));
            }
        }

        Review review = new Review();
        review.setVehicle(vehicle);
        review.setCustomer(customer);
        review.setBooking(booking);
        review.setRating(req.rating);
        review.setComment(req.comment);

        Review saved = reviewRepository.save(review);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // DELETE /api/reviews/{id}  (Admin: remove inappropriate/spam feedback)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
