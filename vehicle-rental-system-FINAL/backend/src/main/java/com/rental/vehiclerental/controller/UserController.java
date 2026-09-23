package com.rental.vehiclerental.controller;

import com.rental.vehiclerental.dto.AuthDtos.*;
import com.rental.vehiclerental.model.User;
import com.rental.vehiclerental.repository.UserRepository;
import com.rental.vehiclerental.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // ---------- AUTH ----------

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@jakarta.validation.Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "An account with this email already exists."));
        }
        User user = new User();
        user.setFullName(req.fullName);
        user.setEmail(req.email);
        user.setNic(req.nic);
        user.setPhone(req.phone);
        user.setPassword(passwordEncoder.encode(req.password));
        user.setRole("CUSTOMER");
        user.setEmailVerified(false);
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);

        User saved = userRepository.save(user);
        emailService.sendVerificationEmail(saved, token);

        // No LoginResponse here on purpose - an unverified account should not be
        // able to start a session. The frontend shows a "check your email" message instead.
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account created. Please check your email to verify your account before logging in.",
                "email", saved.getEmail()
        ));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Optional<User> match = userRepository.findByEmailIgnoreCase(req.email)
                .filter(u -> passwordEncoder.matches(req.password, u.getPassword()));

        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        User u = match.get();
        if (!u.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Please verify your email before logging in. Check your inbox for the verification link."));
        }

        return ResponseEntity.ok(new LoginResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole()));
    }

    // GET /api/auth/verify?token=...  (clicked from the verification email)
    // Returns a small standalone HTML page rather than JSON, since a person
    // clicks this straight from their inbox - there's no frontend page to hand
    // JSON back to.
    @GetMapping(value = "/auth/verify", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        Optional<User> match = userRepository.findByVerificationToken(token);
        if (match.isEmpty()) {
            return ResponseEntity.ok(verifyPage(false,
                    "This verification link is invalid or has already been used."));
        }
        User user = match.get();
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        return ResponseEntity.ok(verifyPage(true,
                "Your email is verified. You can close this tab and log in."));
    }

    // POST /api/auth/resend-verification  { "email": "..." }
    @PostMapping("/auth/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Optional<User> match = email == null ? Optional.empty() : userRepository.findByEmailIgnoreCase(email);

        if (match.isPresent() && !match.get().isEmailVerified()) {
            User user = match.get();
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            userRepository.save(user);
            emailService.sendVerificationEmail(user, token);
        }
        // Same response whether or not the account exists / is already verified -
        // avoids leaking which emails are registered.
        return ResponseEntity.ok(Map.of("message",
                "If that email exists and isn't verified yet, we've resent the verification link."));
    }

    private String verifyPage(boolean success, String message) {
        String color = success ? "#2F8F5B" : "#C7462F";
        String icon = success ? "&#10003;" : "&#10005;";
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>DriveLanka</title></head>"
                + "<body style='font-family:Arial,Helvetica,sans-serif;background:#F5F1E8;display:flex;"
                + "align-items:center;justify-content:center;height:100vh;margin:0;'>"
                + "<div style='background:#fff;border-radius:16px;padding:40px;max-width:420px;text-align:center;"
                + "box-shadow:0 8px 30px rgba(0,0,0,.08);'>"
                + "<div style='width:56px;height:56px;border-radius:50%;background:" + color + ";color:#fff;"
                + "font-size:28px;line-height:56px;margin:0 auto 18px;'>" + icon + "</div>"
                + "<h2 style='margin:0 0 8px;color:#1A1204;'>" + (success ? "Email verified" : "Verification failed") + "</h2>"
                + "<p style='color:#555;'>" + message + "</p>"
                + "<a href='/' style='display:inline-block;margin-top:18px;background:#D98E1E;color:#1A1204;"
                + "padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;'>Go to DriveLanka</a>"
                + "</div></body></html>";
    }

    // ---------- ADMIN: USER CRUD ----------

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updated) {
        return userRepository.findById(id)
                .map(existing -> {
                    existing.setFullName(updated.getFullName());
                    existing.setEmail(updated.getEmail());
                    existing.setNic(updated.getNic());
                    existing.setPhone(updated.getPhone());
                    existing.setRole(updated.getRole());
                    if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(updated.getPassword()));
                    }
                    return ResponseEntity.ok(userRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
