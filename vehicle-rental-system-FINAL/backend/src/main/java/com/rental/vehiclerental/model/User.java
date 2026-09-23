package com.rental.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(unique = true)
    private String email;

    private String nic;

    private String phone;

    // WRITE_ONLY: never serialized back out to clients
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @NotBlank(message = "Password is required")
    private String password;

    @Column(nullable = false)
    private String role = "CUSTOMER"; // CUSTOMER, ADMIN

    @Column(nullable = false)
    private boolean emailVerified = false;

    // Set on registration, cleared once the verification link is clicked.
    // Null for an already-verified account.
    private String verificationToken;

    public User() {
    }

    public User(String fullName, String email, String nic, String phone, String password, String role) {
        this.fullName = fullName;
        this.email = email;
        this.nic = nic;
        this.phone = phone;
        this.password = password;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNic() { return nic; }
    public void setNic(String nic) { this.nic = nic; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
}
