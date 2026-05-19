# Plan: SmartTransport Complete Backend Implementation

Build the entire Spring Boot backend from scratch across 6 layers: entities, repositories, security/JWT, services, controllers, and WebSocket real-time tracking. The project is a greenfield Spring Boot 4.x app with Lombok, Spring Security, JPA, and MySQL already configured in pom.xml. All packages are empty.

## Steps

### 1. Add missing dependencies to pom.xml
- Add `jjwt` (io.jsonwebtoken) for JWT auth, `spring-boot-starter-websocket` for STOMP/WebSocket, `spring-boot-starter-validation` for request validation, and `spring-boot-starter-mail` (optional, for notifications).

### 2. Configure application.properties
- Add MySQL datasource, JPA/Hibernate settings, JWT secret/expiration, and WebSocket config.

### 3. Create JPA Entity models in `model/`
- `User` — id, name, email, password, phone, gender, role (enum: ADMIN/DRIVER/PASSENGER), organizationDomain, profilePic, enabled, createdAt.
- `Organization` — id, name, emailDomain, whitelisted (boolean).
- `Vehicle` — id, user (FK), licensePlate, model, color, totalSeats, licenseDocUrl, approved (boolean).
- `Trip` — id, driver (FK to User), origin, destination, originLat/Lng, destLat/Lng, departureTime, availableSeats, pricePerSeat, dailyRate, recurring (boolean), recurringDays (String), approvalMode (enum: AUTO/MANUAL), status (SCHEDULED/ACTIVE/COMPLETED/CANCELLED), createdAt.
- `Booking` — id, trip (FK), passenger (FK to User), status (PENDING/APPROVED/REJECTED/CANCELLED), fare, bookedAt.
- `DriverLocation` — id, driver (FK), latitude, longitude, updatedAt (for live tracking).
- `Rating` — id, trip (FK), ratedBy (FK), ratedUser (FK), score, comment.

### 4. Create repositories in `repo/`
- One `JpaRepository` per entity. Add custom query methods: `TripRepository.findByFilters(...)` (origin/dest/time/price/gender), `BookingRepository.findByPassengerAndStatus(...)`, `OrganizationRepository.findByEmailDomain(...)`, `DriverLocationRepository.findByDriverId(...)`.

### 5. Implement security layer — new `config/` and `security/` packages
- `SecurityConfig` — configure Spring Security filter chain with JWT filter, stateless sessions, role-based endpoint access, CORS for Angular frontend.
- `JwtTokenProvider` — generate, validate, parse JWT tokens.
- `JwtAuthenticationFilter` — OncePerRequestFilter extracting JWT from Authorization header.
- `CustomUserDetailsService` — loads `User` by email from DB.
- Define roles: `ADMIN`, `DRIVER`, `PASSENGER`.

### 6. Implement services in `service/`
- `AuthService` — register (validate org email domain against whitelist), login (return JWT), profile update.
- `AdminService` — CRUD organizations/whitelisted domains, approve driver vehicles.
- `TripService` — create trip, create recurring trips (expand to individual trip rows per day), edit/cancel (enforce 30-min-before rule), search with filters, decrement seats on booking.
- `BookingService` — request to join, auto-accept or queue for manual review, approve/reject, cancel, compute fare.
- `TrackingService` — update driver location, fetch latest location, check proximity (500m) and trigger alert.
- `RatingService` — submit/fetch ratings per user.
- `NotificationService` — in-app notification logic (booking requests, approvals, proximity alerts); can use WebSocket topics.

### 7. Implement controllers in `controller/`
- `AuthController` — `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/profile`.
- `AdminController` — `CRUD /api/admin/organizations`, `PUT /api/admin/vehicles/{id}/approve`.
- `TripController` — `POST /api/trips`, `GET /api/trips/search`, `PUT /api/trips/{id}`, `DELETE /api/trips/{id}`.
- `BookingController` — `POST /api/bookings`, `PUT /api/bookings/{id}/approve`, `PUT /api/bookings/{id}/reject`.
- `TrackingController` — `PUT /api/tracking/location` (driver posts location).
- `RatingController` — `POST /api/ratings`, `GET /api/ratings/user/{id}`.

### 8. Configure WebSocket for live tracking — new `config/WebSocketConfig`
- Enable STOMP over WebSocket, define broker prefix `/topic`, app destination prefix `/app`.
- `TrackingWebSocketController` — driver sends location via `/app/track`, broadcast to `/topic/trip/{tripId}/location`. Proximity alert pushed to `/topic/trip/{tripId}/proximity`.

### 9. Add DTOs and global exception handling — new `dto/` and `exception/` packages
- Request/Response DTOs for each controller to avoid exposing entities.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) for validation errors, auth errors, not-found, business-rule violations.

## Further Considerations

1. **Database choice:** POM currently has MySQL connector, but FRS specifies PostgreSQL + PostGIS. Switch to `postgresql` driver and add Hibernate Spatial if geospatial queries are needed, or keep MySQL for simplicity?
2. **Email verification:** Should user registration include an email verification flow (send OTP/link), or just validate the domain suffix?
3. **Notifications:** Use only WebSocket push for in-app notifications, or also add email/push notification support?

