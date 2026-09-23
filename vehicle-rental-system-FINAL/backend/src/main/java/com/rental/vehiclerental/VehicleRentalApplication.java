package com.rental.vehiclerental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Web-Based Vehicle Rental System backend.
 * SE2030 - Software Engineering | Group Y2-S1-MLB-B7G1-08
 *
 * Run this class (Shift+F10 in IntelliJ) to start the REST API on
 * http://localhost:8080
 */
@SpringBootApplication
public class VehicleRentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleRentalApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" Vehicle Rental System backend is running!");
        System.out.println(" API base URL : http://localhost:8080/api");
        System.out.println(" H2 console   : http://localhost:8080/h2-console");
        System.out.println("=================================================");
    }
}
