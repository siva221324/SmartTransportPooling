package com.interim.SmartTransport.service;

import com.interim.SmartTransport.dto.*;
import com.interim.SmartTransport.model.EmailVerificationToken;
import com.interim.SmartTransport.model.PasswordResetToken;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.enums.Role;
import com.interim.SmartTransport.repo.EmailVerificationTokenRepository;
import com.interim.SmartTransport.repo.OrganizationRepository;
import com.interim.SmartTransport.repo.PasswordResetTokenRepository;
import com.interim.SmartTransport.repo.UserRepository;
import com.interim.SmartTransport.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Value("${app.email-verification-enabled:false}")
    private boolean emailVerificationEnabled;

    public AuthService(UserRepository userRepository, OrganizationRepository organizationRepository,
                       PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider, EmailService emailService,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailVerificationTokenRepository emailVerificationTokenRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String domain = request.getEmail().substring(request.getEmail().indexOf("@") + 1);
        if (!organizationRepository.existsByEmailDomainAndWhitelistedTrue(domain)) {
            throw new RuntimeException("Organization email domain not whitelisted: " + domain);
        }

        Role role = Role.USER;
        if (request.getRole() != null) {
            try {
                Role requested = Role.valueOf(request.getRole().toUpperCase());
                if (requested == Role.ADMIN) {
                    role = Role.USER; // prevent self-admin
                } else {
                    role = requested;
                }
            } catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .gender(request.getGender())
                .department(request.getDepartment())
                .city(request.getCity())
                .role(role)
                .organizationDomain(domain)
                .enabled(true)
                .emailVerified(!emailVerificationEnabled)
                .build();

        userRepository.save(user);

        // Send verification email only if enabled
        if (emailVerificationEnabled) {
            String verifyToken = UUID.randomUUID().toString();
            EmailVerificationToken evt = EmailVerificationToken.builder()
                    .token(verifyToken)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusHours(24))
                    .build();
            emailVerificationTokenRepository.save(evt);
            emailService.sendEmailVerificationMail(user.getEmail(), verifyToken);
        }

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (emailVerificationEnabled && !user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in. Check your inbox.");
        }

        String token = jwtTokenProvider.generateToken(authentication);
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User updateProfile(String email, RegisterRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getCity() != null) user.setCity(request.getCity());
        return userRepository.save(user);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email"));
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));
        if (resetToken.isUsed()) throw new RuntimeException("This reset link has already been used");
        if (resetToken.isExpired()) throw new RuntimeException("This reset link has expired");
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    public void verifyEmail(String token) {
        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));
        if (evt.isExpired()) throw new RuntimeException("Verification link has expired. Please register again.");
        User user = evt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationTokenRepository.delete(evt);
    }

    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email"));
        if (user.isEmailVerified()) throw new RuntimeException("Email is already verified");
        String verifyToken = UUID.randomUUID().toString();
        EmailVerificationToken evt = EmailVerificationToken.builder()
                .token(verifyToken)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        emailVerificationTokenRepository.save(evt);
        emailService.sendEmailVerificationMail(user.getEmail(), verifyToken);
    }
}

