package com.rental.vehiclerental.repository;

import com.rental.vehiclerental.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByTypeIgnoreCase(String type);
    List<Vehicle> findByStatusIgnoreCase(String status);
    List<Vehicle> findByBrandIgnoreCase(String brand);
    List<Vehicle> findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(String name, String brand);
}
