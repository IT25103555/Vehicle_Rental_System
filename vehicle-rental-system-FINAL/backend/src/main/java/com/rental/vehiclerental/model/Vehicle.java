package com.rental.vehiclerental.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Vehicle name is required")
    private String name;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Vehicle type is required")
    private String type; // Car, Van, SUV, Motorbike

    private String fuelType; // Petrol, Diesel, Electric, Hybrid

    private String transmission; // Manual, Automatic

    @NotNull(message = "Rental price is required")
    @Positive(message = "Rental price must be positive")
    private Double pricePerDay;

    private String imageUrl;

    private String description;

    @Column(nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, RENTED, MAINTENANCE

    private String registrationNumber;

    public Vehicle() {
    }

    public Vehicle(String name, String brand, String type, String fuelType, String transmission,
                    Double pricePerDay, String imageUrl, String description, String status,
                    String registrationNumber) {
        this.name = name;
        this.brand = brand;
        this.type = type;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.pricePerDay = pricePerDay;
        this.imageUrl = imageUrl;
        this.description = description;
        this.status = status;
        this.registrationNumber = registrationNumber;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public Double getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(Double pricePerDay) { this.pricePerDay = pricePerDay; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
}
