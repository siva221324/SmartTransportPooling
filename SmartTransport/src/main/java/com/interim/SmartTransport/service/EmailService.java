package com.interim.SmartTransport.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject = "SmartTransport - Reset Your Password";
        String body = "Hello,\n\n"
                + "You requested a password reset for your SmartTransport account.\n\n"
                + "Click the link below to reset your password:\n"
                + resetLink + "\n\n"
                + "This link expires in 30 minutes.\n\n"
                + "If you didn't request this, please ignore this email.\n\n"
                + "— SmartTransport Team";

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendEmailVerificationMail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        String subject = "SmartTransport - Verify Your Email";
        String body = "Welcome to SmartTransport!\n\n"
                + "Please verify your email address by clicking the link below:\n"
                + verifyLink + "\n\n"
                + "This link expires in 24 hours.\n\n"
                + "— SmartTransport Team";

        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendBookingApprovedEmail(String toEmail, String origin, String destination) {
        sendEmail(toEmail, "SmartTransport - Booking Approved!",
                "Great news! Your booking for the trip " + origin + " → " + destination
                + " has been approved.\n\nLog in to view details.\n\n— SmartTransport Team");
    }

    @Async
    public void sendBookingRejectedEmail(String toEmail, String origin, String destination) {
        sendEmail(toEmail, "SmartTransport - Booking Rejected",
                "Unfortunately, your booking for the trip " + origin + " → " + destination
                + " was rejected by the driver.\n\nTry searching for other rides.\n\n— SmartTransport Team");
    }

    @Async
    public void sendTripCancelledEmail(String toEmail, String origin, String destination) {
        sendEmail(toEmail, "SmartTransport - Trip Cancelled",
                "The trip " + origin + " → " + destination
                + " has been cancelled by the driver.\n\nPlease search for alternative rides.\n\n— SmartTransport Team");
    }

    @Async
    public void sendTripReminderEmail(String toEmail, String origin, String destination, String departureTime) {
        sendEmail(toEmail, "SmartTransport - Trip Reminder",
                "Reminder: Your trip " + origin + " → " + destination
                + " departs at " + departureTime + ".\n\nDon't be late!\n\n— SmartTransport Team");
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
