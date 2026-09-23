package com.rental.vehiclerental.config;

import com.rental.vehiclerental.model.Booking;
import com.rental.vehiclerental.model.User;
import com.rental.vehiclerental.model.Vehicle;
import com.rental.vehiclerental.repository.BookingRepository;
import com.rental.vehiclerental.repository.UserRepository;
import com.rental.vehiclerental.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Runs once at startup. Only inserts seed rows the FIRST time the app
 * runs against an empty database, so restarting never duplicates data
 * and anything you add/edit/delete through the app or the admin panel
 * persists exactly as you left it.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private final Random random = new Random(42); // fixed seed -> same demo data every fresh run

    @Override
    public void run(String... args) {
        seedUsers();
        seedVehicles();
        seedBookings();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        User admin = new User("System Admin", "admin@rentalsystem.lk", "N/A", "0770000000",
                passwordEncoder.encode("admin123"), "ADMIN");
        admin.setEmailVerified(true); // seeded demo accounts skip the verification step
        userRepository.save(admin);

        String[][] customers = {
            {"Kasun Silva", "kasun@example.com", "982345678V", "0712345678"},
            {"Nadeesha Perera", "nadeesha@example.com", "199534567890", "0723456789"},
            {"Ruwan Fernando", "ruwan@example.com", "912345671V", "0734567890"},
            {"Ishara Jayasuriya", "ishara@example.com", "200078912345", "0745678901"},
        };
        for (String[] c : customers) {
            User customer = new User(c[0], c[1], c[2], c[3], passwordEncoder.encode("customer123"), "CUSTOMER");
            customer.setEmailVerified(true);
            userRepository.save(customer);
        }

        System.out.println(">> Seeded default users. Admin login: admin@rentalsystem.lk / admin123");
    }

    private void seedVehicles() {
        if (vehicleRepository.count() > 0) return;

        // Every imageUrl below is a real, verified images.unsplash.com photo (free to use under
        // the Unsplash license) - no duplicates, no placeholder/dead links.
        final String IMG_HATCHBACK_1 = "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600";
        final String IMG_SEDAN_1     = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600";
        final String IMG_SEDAN_2     = "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600";
        final String IMG_VAN_1       = "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600";
        final String IMG_HATCHBACK_2 = "https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=600";
        final String IMG_SUV_1       = "https://images.unsplash.com/photo-1758219751271-bc46553e2b41?w=600"; // verified separately from the van photo - fixes the old duplicate
        final String IMG_MOTORBIKE_1 = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600";
        final String IMG_SEDAN_3     = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600";

        List<Vehicle> vehicles = new ArrayList<>();

        vehicles.add(new Vehicle("Wagon R", "Suzuki", "Car", "Petrol", "Automatic",
                8500.0, IMG_HATCHBACK_1, "Compact and fuel-efficient, perfect for city driving.", "AVAILABLE", "CAR-1001"));
        vehicles.add(new Vehicle("Axio", "Toyota", "Car", "Hybrid", "Automatic",
                11000.0, IMG_SEDAN_1, "Comfortable sedan ideal for families and business travel.", "AVAILABLE", "CAR-1002"));
        vehicles.add(new Vehicle("Prius", "Toyota", "Car", "Hybrid", "Automatic",
                12500.0, IMG_SEDAN_2, "Smooth hybrid ride with excellent mileage for long trips.", "RENTED", "CAR-1003"));
        vehicles.add(new Vehicle("KDH", "Toyota", "Van", "Diesel", "Manual",
                16000.0, IMG_VAN_1, "Spacious van for group travel, up to 14 passengers.", "AVAILABLE", "VAN-2001"));
        vehicles.add(new Vehicle("Vitz", "Toyota", "Car", "Petrol", "Automatic",
                7500.0, IMG_HATCHBACK_2, "Budget-friendly hatchback, great for short city trips.", "AVAILABLE", "CAR-1004"));
        vehicles.add(new Vehicle("X-Trail", "Nissan", "SUV", "Petrol", "Automatic",
                15500.0, IMG_SUV_1, "Powerful SUV built for comfort on long-distance journeys.", "MAINTENANCE", "SUV-3001"));
        vehicles.add(new Vehicle("PCX", "Honda", "Motorbike", "Petrol", "Automatic",
                3000.0, IMG_MOTORBIKE_1, "Nimble scooter, ideal for solo riders beating city traffic.", "AVAILABLE", "BIKE-4001"));
        vehicles.add(new Vehicle("Civic", "Honda", "Car", "Petrol", "Automatic",
                13500.0, IMG_SEDAN_3, "Sporty sedan with a refined ride and modern features.", "AVAILABLE", "CAR-1005"));

        // Additional fleet (reusing the same verified photos by matching body type, so
        // nothing links to a broken/unrelated image, while giving customers more to browse).
        vehicles.add(new Vehicle("Alto", "Suzuki", "Car", "Petrol", "Manual",
                6500.0, IMG_HATCHBACK_1, "Entry-level hatchback - the cheapest way to get around town.", "AVAILABLE", "CAR-1006"));
        vehicles.add(new Vehicle("Swift", "Suzuki", "Car", "Petrol", "Automatic",
                9000.0, IMG_HATCHBACK_2, "Peppy hatchback with sharp handling for city streets.", "AVAILABLE", "CAR-1007"));
        vehicles.add(new Vehicle("Corolla", "Toyota", "Car", "Petrol", "Automatic",
                10500.0, IMG_SEDAN_1, "The dependable, do-everything family sedan.", "AVAILABLE", "CAR-1008"));
        vehicles.add(new Vehicle("Allion", "Toyota", "Car", "Petrol", "Automatic",
                11500.0, IMG_SEDAN_2, "A roomy, comfortable sedan popular for long-distance hires.", "AVAILABLE", "CAR-1009"));
        vehicles.add(new Vehicle("Aqua", "Toyota", "Car", "Hybrid", "Automatic",
                10000.0, IMG_SEDAN_3, "Efficient hybrid hatchback with low running costs.", "RENTED", "CAR-1010"));
        vehicles.add(new Vehicle("City", "Honda", "Car", "Petrol", "Automatic",
                11800.0, IMG_SEDAN_1, "Well-equipped sedan with a spacious cabin.", "AVAILABLE", "CAR-1011"));
        vehicles.add(new Vehicle("Leaf", "Nissan", "Car", "Electric", "Automatic",
                9500.0, IMG_SEDAN_2, "Fully electric hatchback - zero fuel cost, silent ride.", "AVAILABLE", "CAR-1012"));
        vehicles.add(new Vehicle("Picanto", "Kia", "Car", "Petrol", "Manual",
                6800.0, IMG_HATCHBACK_1, "Tiny and easy to park - great for first-time drivers.", "AVAILABLE", "CAR-1013"));
        vehicles.add(new Vehicle("Caravan", "Nissan", "Van", "Diesel", "Manual",
                17500.0, IMG_VAN_1, "Extra-spacious van for large groups and cargo.", "AVAILABLE", "VAN-2002"));
        vehicles.add(new Vehicle("Hiace", "Toyota", "Van", "Diesel", "Manual",
                16500.0, IMG_VAN_1, "The classic Sri Lankan tour van - reliable and roomy.", "RENTED", "VAN-2003"));
        vehicles.add(new Vehicle("CR-V", "Honda", "SUV", "Petrol", "Automatic",
                15000.0, IMG_SUV_1, "Family SUV with a smooth ride and generous boot space.", "AVAILABLE", "SUV-3002"));
        vehicles.add(new Vehicle("Sportage", "Kia", "SUV", "Diesel", "Automatic",
                16000.0, IMG_SUV_1, "Bold styling with strong performance for highway trips.", "AVAILABLE", "SUV-3003"));
        vehicles.add(new Vehicle("Tucson", "Hyundai", "SUV", "Petrol", "Automatic",
                15800.0, IMG_SUV_1, "Modern SUV with a comfortable, tech-forward cabin.", "MAINTENANCE", "SUV-3004"));
        vehicles.add(new Vehicle("Vespa", "Piaggio", "Motorbike", "Petrol", "Automatic",
                3200.0, IMG_MOTORBIKE_1, "Stylish scooter, easy to ride and even easier to park.", "AVAILABLE", "BIKE-4002"));
        vehicles.add(new Vehicle("FZ", "Yamaha", "Motorbike", "Petrol", "Manual",
                2800.0, IMG_MOTORBIKE_1, "Sporty commuter bike with a punchy engine.", "AVAILABLE", "BIKE-4003"));
        vehicles.add(new Vehicle("Pulsar", "Bajaj", "Motorbike", "Petrol", "Manual",
                2600.0, IMG_MOTORBIKE_1, "Reliable, affordable bike for everyday commuting.", "AVAILABLE", "BIKE-4004"));

        vehicleRepository.saveAll(vehicles);
        System.out.println(">> Seeded " + vehicles.size() + " demo vehicles into the database.");
    }

    private void seedBookings() {
        if (bookingRepository.count() > 0) return;

        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<User> customers = userRepository.findAll().stream()
                .filter(u -> "CUSTOMER".equals(u.getRole()))
                .toList();
        if (vehicles.isEmpty() || customers.isEmpty()) return;

        String[] statusPool = {"COMPLETED", "COMPLETED", "COMPLETED", "CONFIRMED", "CANCELLED"};
        List<Booking> bookings = new ArrayList<>();

        // Spread demo bookings across the last 6 months so Reports/AI Insights have
        // enough history to show real month-to-month and per-category patterns.
        for (int i = 0; i < 40; i++) {
            Vehicle vehicle = vehicles.get(random.nextInt(vehicles.size()));
            User customer = customers.get(random.nextInt(customers.size()));

            int daysAgo = random.nextInt(180); // sometime in the last ~6 months
            int rentalDays = 1 + random.nextInt(5);
            LocalDate start = LocalDate.now().minusDays(daysAgo);
            LocalDate end = start.plusDays(rentalDays);

            String status = statusPool[random.nextInt(statusPool.length)];
            // Real-world rentals rarely land exactly on list-rate x days (discounts, surcharges,
            // negotiated rates) - a +/-15% variance here gives the price-prediction and model-
            // comparison AI features actual variance to analyze, instead of a trivially perfect match.
            double variance = 0.85 + random.nextDouble() * 0.30; // 0.85x .. 1.15x
            double totalCost = Math.round(rentalDays * vehicle.getPricePerDay() * variance);

            Booking booking = new Booking();
            booking.setVehicle(vehicle);
            booking.setCustomer(customer);
            booking.setStartDate(start);
            booking.setEndDate(end);
            booking.setTotalCost(totalCost);
            booking.setStatus(status);
            booking.setPaymentStatus("COMPLETED".equals(status) ? "PAID" : "UNPAID");

            bookings.add(booking);
        }

        bookingRepository.saveAll(bookings);
        System.out.println(">> Seeded " + bookings.size() + " demo bookings for Reports/AI Insights.");
    }
}
