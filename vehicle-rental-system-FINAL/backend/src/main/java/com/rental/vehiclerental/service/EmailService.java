package com.rental.vehiclerental.service;

import com.rental.vehiclerental.model.Booking;
import com.rental.vehiclerental.model.User;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends the app's transactional emails: account verification, booking
 * received, and payment receipt.
 *
 * Safe by design even when mail isn't configured at all:
 *  - JavaMailSender is injected with required=false, so a missing/unconfigured
 *    mail setup never crashes application startup.
 *  - Every send is also gated behind app.mail.enabled (default false in
 *    application.properties) and wrapped in try/catch, so a bad SMTP
 *    password or network hiccup logs a line to the console instead of
 *    breaking registration, booking, or payment for the user.
 *  - Each method is @Async so the actual network call to the mail server
 *    happens in the background - the API response to the browser doesn't
 *    sit there waiting for an email to send.
 */
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.backend-url:http://localhost:8080}")
    private String backendUrl;

    private static final String AMBER = "#D98E1E";
    private static final String INK = "#1A1204";
    private static final String GOOD = "#2F8F5B";

    @Async
    public void sendVerificationEmail(User user, String token) {
        String link = backendUrl + "/api/auth/verify?token=" + token;
        String html = wrapper(
                "<h2 style='color:" + AMBER + ";margin:0 0 12px;'>Welcome to DriveLanka, " + escape(firstName(user)) + "!</h2>"
                + "<p>Please confirm your email address to activate your account and start booking.</p>"
                + button(link, "Verify my email")
                + "<p style='color:#888;font-size:12px;margin-top:20px;'>Or paste this link into your browser:<br>"
                + "<a href='" + link + "'>" + link + "</a></p>"
        );
        if (!mailEnabled || mailSender == null) {
            // Mail isn't configured yet - print the actual clickable link so you
            // can copy-paste it straight from the console instead of hunting
            // through the database for the token.
            System.out.println(">> [EmailService] Mail disabled/unconfigured - verify " + user.getEmail()
                    + " manually by opening this link in your browser: " + link);
            return;
        }
        send(user.getEmail(), "Verify your DriveLanka account", html);
    }

    @Async
    public void sendBookingReceivedEmail(User user, Booking booking) {
        String html = wrapper(
                "<h2 style='color:" + AMBER + ";margin:0 0 12px;'>Booking received</h2>"
                + "<p>Hi " + escape(firstName(user)) + ", your booking has been received and is awaiting payment.</p>"
                + detailsTable(booking)
                + "<p>Complete payment from the My Bookings page to confirm your reservation.</p>"
        );
        send(user.getEmail(), "Booking received - DriveLanka", html);
    }

    @Async
    public void sendPaymentReceiptEmail(User user, Booking booking) {
        String html = wrapper(
                "<h2 style='color:" + GOOD + ";margin:0 0 12px;'>Payment received</h2>"
                + "<p>Hi " + escape(firstName(user)) + ", we've received your payment. Your booking is now confirmed.</p>"
                + detailsTable(booking)
                + "<p>Thanks for choosing DriveLanka!</p>"
        );
        send(user.getEmail(), "Payment receipt - DriveLanka", html);
    }

    @Async
    public void sendBookingCompletedEmail(User user, Booking booking) {
        String html = wrapper(
                "<h2 style='color:" + AMBER + ";margin:0 0 12px;'>Rental completed</h2>"
                + "<p>Hi " + escape(firstName(user)) + ", your rental period has ended. We hope you had a great trip!</p>"
                + detailsTable(booking)
                + "<p>Ready to book again? Head back to DriveLanka whenever you need a vehicle.</p>"
        );
        send(user.getEmail(), "Your rental is complete - DriveLanka", html);
    }

    private String detailsTable(Booking booking) {
        Object vehicleName = booking.getVehicle() != null ? booking.getVehicle().getName() : "-";
        return "<table style='width:100%;border-collapse:collapse;margin:16px 0;'>"
                + row("Booking #", String.valueOf(booking.getId()))
                + row("Vehicle", escape(String.valueOf(vehicleName)))
                + row("Pick-up", String.valueOf(booking.getStartDate()))
                + row("Return", String.valueOf(booking.getEndDate()))
                + row("Total", "LKR " + booking.getTotalCost())
                + "</table>";
    }

    private String row(String label, String value) {
        return "<tr>"
                + "<td style='padding:6px 0;color:#888;font-size:13px;'>" + label + "</td>"
                + "<td style='padding:6px 0;font-weight:bold;text-align:right;'>" + value + "</td>"
                + "</tr>";
    }

    private String button(String href, String label) {
        return "<p><a href='" + href + "' style='background:" + AMBER + ";color:" + INK + ";padding:12px 22px;"
                + "text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;'>" + label + "</a></p>";
    }

    private String wrapper(String inner) {
        return "<div style='font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;"
                + "border:1px solid #eee;border-radius:12px;padding:28px;color:#222;'>"
                + "<div style='color:" + AMBER + ";font-weight:bold;font-size:14px;margin-bottom:18px;'>&#9642; DriveLanka</div>"
                + inner
                + "</div>";
    }

    private String firstName(User user) {
        String name = user.getFullName();
        if (name == null || name.isBlank()) return "there";
        return name.trim().split("\\s+")[0];
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private void send(String to, String subject, String html) {
        if (!mailEnabled || mailSender == null) {
            System.out.println(">> [EmailService] Mail disabled or unconfigured - would have sent \""
                    + subject + "\" to " + to + ". Set app.mail.enabled=true and spring.mail.* in "
                    + "application.properties to actually send it.");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            mailSender.send(message);
            System.out.println(">> [EmailService] Sent \"" + subject + "\" to " + to);
        } catch (Exception e) {
            System.out.println(">> [EmailService] Failed to send \"" + subject + "\" to " + to + ": " + e.getMessage());
        }
    }
}
