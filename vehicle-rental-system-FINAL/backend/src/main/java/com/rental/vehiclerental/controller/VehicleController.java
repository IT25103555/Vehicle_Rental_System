package com.rental.vehiclerental.controller;

import com.rental.vehiclerental.model.Vehicle;
import com.rental.vehiclerental.repository.VehicleRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for vehicle inventory.
 * Used by BOTH the public frontend (read-only browsing) and the
 * admin panel (full CRUD). Every write here is persisted straight
 * to the SQL database via Spring Data JPA.
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    // GET /api/vehicles  (optional ?type=&brand=&status=&search=)
    @GetMapping
    public List<Vehicle> getAllVehicles(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        if (search != null && !search.isBlank()) {
            return vehicleRepository.findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(search, search);
        }
        if (type != null && !type.isBlank()) {
            return vehicleRepository.findByTypeIgnoreCase(type);
        }
        if (brand != null && !brand.isBlank()) {
            return vehicleRepository.findByBrandIgnoreCase(brand);
        }
        if (status != null && !status.isBlank()) {
            return vehicleRepository.findByStatusIgnoreCase(status);
        }
        return vehicleRepository.findAll();
    }

    // GET /api/vehicles/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/vehicles  (Create - Admin)
    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        vehicle.setId(null); // ensure a new row is always inserted
        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/vehicles/{id}  (Update - Admin)
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @Valid @RequestBody Vehicle updated) {
        return vehicleRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setBrand(updated.getBrand());
                    existing.setType(updated.getType());
                    existing.setFuelType(updated.getFuelType());
                    existing.setTransmission(updated.getTransmission());
                    existing.setPricePerDay(updated.getPricePerDay());
                    existing.setImageUrl(updated.getImageUrl());
                    existing.setDescription(updated.getDescription());
                    existing.setStatus(updated.getStatus());
                    existing.setRegistrationNumber(updated.getRegistrationNumber());
                    Vehicle saved = vehicleRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PATCH /api/vehicles/{id}/status  (quick status change - Admin)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Vehicle> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return vehicleRepository.findById(id)
                .map(existing -> {
                    existing.setStatus(body.get("status"));
                    return ResponseEntity.ok(vehicleRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/vehicles/{id}  (Delete - Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
