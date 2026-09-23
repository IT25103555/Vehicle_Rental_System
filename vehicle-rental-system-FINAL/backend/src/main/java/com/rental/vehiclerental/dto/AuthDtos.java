package com.rental.vehiclerental.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AuthDtos {

    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        public String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        public String email;

        // Old NIC: 9 digits + V/X. New NIC: exactly 12 digits.
        @NotBlank(message = "NIC is required")
        @Pattern(regexp = "^(\\d{9}[VvXx]|\\d{12})$",
                message = "NIC must be 9 digits followed by V or X (old format) or exactly 12 digits (new format).")
        public String nic;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^0\\d{9}$", message = "Phone number must be exactly 10 digits, starting with 0.")
        public String phone;

        @NotBlank(message = "Password is required")
        public String password;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class LoginResponse {
        public Long id;
        public String fullName;
        public String email;
        public String role;

        public LoginResponse(Long id, String fullName, String email, String role) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
        }
    }
}
