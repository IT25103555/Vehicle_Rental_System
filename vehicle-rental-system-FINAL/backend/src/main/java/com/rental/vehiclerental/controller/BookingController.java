package com.rental.vehiclerental.controller;

import com.rental.vehiclerental.dto.BookingRequest;
import com.rental.vehiclerental.model.Booking;
import com.rental.vehiclerental.model.User;
import com.rental.vehiclerental.model.Vehicle;
import com.rental.vehiclerental.repository.BookingRepository;
import com.rental.vehiclerental.repository.UserRepository;
import com.rental.vehiclerental.repository.VehicleRepository;
import com.rental.vehiclerental.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // GET /api/bookings  (Admin: all bookings, optionally ?customerId=)
    @GetMapping
    public List<Booking> getBookings(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return bookingRepository.findByCustomerId(customerId);
        }
        return bookingRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long id) {
        return bookingRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // POST /api/bookings  (Create - Customer books a vehicle)
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest req) {
        Vehicle vehicle = vehicleRepository.findById(req.vehicleId).orElse(null);
        User customer = userRepository.findById(req.customerId).orElse(null);

        if (vehicle == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vehicle not found."));
        }
        if (customer == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer not found."));
        }
        if (!"AVAILABLE".equalsIgnoreCase(vehicle.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Selected vehicle is not available."));
        }
        if (req.endDate.isBefore(req.startDate)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Return date must be after pick-up date."));
        }

        long days = ChronoUnit.DAYS.between(req.startDate, req.endDate);
        if (days < 1) days = 1;
        double totalCost = days * vehicle.getPricePerDay();

        Booking booking = new Booking();
        booking.setVehicle(vehicle);
        booking.setCustomer(customer);
        booking.setStartDate(req.startDate);
        booking.setEndDate(req.endDate);
        booking.setTotalCost(totalCost);
        booking.setStatus("CONFIRMED");
        booking.setPaymentStatus("UNPAID");

        Booking saved = bookingRepository.save(booking);

        // Reflect the change straight back into vehicle availability in the DB
        vehicle.setStatus("RESERVED");
        vehicleRepository.save(vehicle);

        emailService.sendBookingReceivedEmail(customer, saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Only these are real booking statuses - anything else is rejected up front
    // so a frontend typo can never silently save garbage into the database.
    private static final java.util.Set<String> VALID_BOOKING_STATUSES =
            java.util.Set.of("PENDING", "CONFIRMED", "CANCELLED", "COMPLETED");

    // PATCH /api/bookings/{id}/status  (Admin: approve / cancel / complete)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String rawStatus = body.get("status");
        if (rawStatus == null || !VALID_BOOKING_STATUSES.contains(rawStatus.toUpperCase())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "status must be one of CONFIRMED, CANCELLED, COMPLETED."));
        }
        String newStatus = rawStatus.toUpperCase();

        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setStatus(newStatus);

                    // Cancelling a booking that was already paid should refund it - otherwise
                    // the booking would stay marked PAID forever with no record it was ever
                    // reversed, which looks like money was taken and never accounted for.
                    if ("CANCELLED".equalsIgnoreCase(newStatus) && "PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
                        booking.setPaymentStatus("REFUNDED");
                    }
                    // If a refunded booking gets re-confirmed, the refund already happened -
                    // it needs to be paid again, not sit stuck showing REFUNDED forever.
                    if ("CONFIRMED".equalsIgnoreCase(newStatus) && "REFUNDED".equalsIgnoreCase(booking.getPaymentStatus())) {
                        booking.setPaymentStatus("UNPAID");
                    }

                    Booking saved = bookingRepository.save(booking);

                    if ("COMPLETED".equalsIgnoreCase(newStatus)) {
                        emailService.sendBookingCompletedEmail(saved.getCustomer(), saved);
                    }

                    // Free up (or reserve) the vehicle depending on the new booking status
                    Vehicle vehicle = booking.getVehicle();
                    if ("CANCELLED".equalsIgnoreCase(newStatus) || "COMPLETED".equalsIgnoreCase(newStatus)) {
                        vehicle.setStatus("AVAILABLE");
                        vehicleRepository.save(vehicle);
                    } else if ("CONFIRMED".equalsIgnoreCase(newStatus)) {
                        vehicle.setStatus("RESERVED");
                        vehicleRepository.save(vehicle);
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PATCH /api/bookings/{id}/pay  (simulated payment)
    @PatchMapping("/{id}/pay")
    public ResponseEntity<?> markPaid(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setPaymentStatus("PAID");
                    Booking saved = bookingRepository.save(booking);
                    emailService.sendPaymentReceiptEmail(saved.getCustomer(), saved);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/bookings/{id}  (Update dates - Admin/Customer)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable Long id, @RequestBody BookingRequest req) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    booking.setStartDate(req.startDate);
                    booking.setEndDate(req.endDate);
                    long days = ChronoUnit.DAYS.between(req.startDate, req.endDate);
                    if (days < 1) days = 1;
                    booking.setTotalCost(days * booking.getVehicle().getPricePerDay());
                    return ResponseEntity.ok(bookingRepository.save(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/bookings/{id}  (Delete - Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    Vehicle vehicle = booking.getVehicle();
                    vehicle.setStatus("AVAILABLE");
                    vehicleRepository.save(vehicle);
                    bookingRepository.delete(booking);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
