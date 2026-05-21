package com.interim.SmartTransport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interim.SmartTransport.dto.BookingRequest;
import com.interim.SmartTransport.exception.GlobalExceptionHandler;
import com.interim.SmartTransport.model.Booking;
import com.interim.SmartTransport.model.Trip;
import com.interim.SmartTransport.model.User;
import com.interim.SmartTransport.model.enums.BookingStatus;
import com.interim.SmartTransport.model.enums.BookingType;
import com.interim.SmartTransport.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc unit tests for BookingController.
 *
 * Uses MockitoExtension + standaloneSetup so no Spring context is loaded.
 * The "userEmail" request attribute is injected directly via requestAttr(),
 * mirroring what JwtAuthenticationFilter does at runtime.
 *
 * GlobalExceptionHandler is registered on the standalone builder so that
 * RuntimeException → 400 error responses are exercised exactly as in production.
 */
@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    // ── Constants ──────────────────────────────────────────────────────────────

    private static final String USER_EMAIL   = "passenger@example.com";
    private static final String DRIVER_EMAIL = "driver@example.com";

    // ── Fixtures ───────────────────────────────────────────────────────────────

    private Booking pendingBooking;
    private Booking approvedBooking;
    private Booking rejectedBooking;
    private Booking cancelledBooking;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(bookingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        User passenger = User.builder().id(1L).email(USER_EMAIL).name("Passenger One").build();
        User driver    = User.builder().id(2L).email(DRIVER_EMAIL).name("Driver One").build();

        Trip trip = Trip.builder()
                .id(10L)
                .origin("Chennai")
                .destination("Bangalore")
                .departureTime(LocalDateTime.now().plusDays(1))
                .availableSeats(3)
                .driver(driver)
                .build();

        pendingBooking = Booking.builder()
                .id(1L).trip(trip).passenger(passenger)
                .status(BookingStatus.PENDING)
                .seatsBooked(1).bookingType(BookingType.SINGLE)
                .fare(BigDecimal.valueOf(500))
                .build();

        approvedBooking = Booking.builder()
                .id(1L).trip(trip).passenger(passenger)
                .status(BookingStatus.APPROVED)
                .seatsBooked(1).bookingType(BookingType.SINGLE)
                .fare(BigDecimal.valueOf(500))
                .build();

        rejectedBooking = Booking.builder()
                .id(1L).trip(trip).passenger(passenger)
                .status(BookingStatus.REJECTED)
                .seatsBooked(1).bookingType(BookingType.SINGLE)
                .fare(BigDecimal.valueOf(500))
                .build();

        cancelledBooking = Booking.builder()
                .id(1L).trip(trip).passenger(passenger)
                .status(BookingStatus.CANCELLED)
                .seatsBooked(1).bookingType(BookingType.SINGLE)
                .fare(BigDecimal.valueOf(500))
                .build();
    }

    // ── POST /api/bookings/{tripId} ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/bookings/{tripId} — MANUAL mode returns PENDING booking")
    void requestBooking_manualMode_returnsPending() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(1);
        req.setBookingType("SINGLE");

        when(bookingService.requestBooking(eq(10L), eq(USER_EMAIL), eq(1), eq("SINGLE"), isNull()))
                .thenReturn(pendingBooking);

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.seatsBooked").value(1))
                .andExpect(jsonPath("$.fare").value(500));

        verify(bookingService).requestBooking(10L, USER_EMAIL, 1, "SINGLE", null);
    }

    @Test
    @DisplayName("POST /api/bookings/{tripId} — AUTO mode returns APPROVED booking")
    void requestBooking_autoMode_returnsApproved() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(2);
        req.setBookingType("SINGLE");

        when(bookingService.requestBooking(eq(10L), eq(USER_EMAIL), eq(2), eq("SINGLE"), isNull()))
                .thenReturn(approvedBooking);

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/bookings/{tripId} — departed trip returns 400")
    void requestBooking_departedTrip_returns400() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(1);
        req.setBookingType("SINGLE");

        when(bookingService.requestBooking(anyLong(), anyString(), anyInt(), anyString(), any()))
                .thenThrow(new RuntimeException("Cannot book a trip that has already departed"));

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot book a trip that has already departed"));
    }

    @Test
    @DisplayName("POST /api/bookings/{tripId} — no seats available returns 400")
    void requestBooking_noSeats_returns400() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(5);
        req.setBookingType("SINGLE");

        when(bookingService.requestBooking(anyLong(), anyString(), anyInt(), anyString(), any()))
                .thenThrow(new RuntimeException("Not enough available seats"));

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Not enough available seats"));
    }

    @Test
    @DisplayName("POST /api/bookings/{tripId} — RECURRING booking with bookedDays")
    void requestBooking_recurring_passesBookedDays() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(1);
        req.setBookingType("RECURRING");
        req.setBookedDays("MON,TUE,WED");

        Booking recurringBooking = Booking.builder()
                .id(2L).status(BookingStatus.PENDING)
                .seatsBooked(1).bookingType(BookingType.RECURRING)
                .bookedDays("MON,TUE,WED").fare(BigDecimal.valueOf(1500))
                .build();

        when(bookingService.requestBooking(eq(10L), eq(USER_EMAIL), eq(1), eq("RECURRING"), eq("MON,TUE,WED")))
                .thenReturn(recurringBooking);

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingType").value("RECURRING"))
                .andExpect(jsonPath("$.bookedDays").value("MON,TUE,WED"));

        verify(bookingService).requestBooking(10L, USER_EMAIL, 1, "RECURRING", "MON,TUE,WED");
    }

    @Test
    @DisplayName("POST /api/bookings/{tripId} — duplicate booking returns 400")
    void requestBooking_duplicate_returns400() throws Exception {
        BookingRequest req = new BookingRequest();
        req.setSeats(1);
        req.setBookingType("SINGLE");

        when(bookingService.requestBooking(anyLong(), anyString(), anyInt(), anyString(), any()))
                .thenThrow(new RuntimeException("You have already booked this trip"));

        mockMvc.perform(post("/api/bookings/10")
                        .requestAttr("userEmail", USER_EMAIL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You have already booked this trip"));
    }

    // ── PUT /api/bookings/{id}/approve ─────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/bookings/{id}/approve — driver approves, returns APPROVED")
    void approveBooking_returnsApproved() throws Exception {
        when(bookingService.approveBooking(eq(1L), eq(DRIVER_EMAIL)))
                .thenReturn(approvedBooking);

        mockMvc.perform(put("/api/bookings/1/approve")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(bookingService).approveBooking(1L, DRIVER_EMAIL);
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/approve — non-driver returns 400")
    void approveBooking_notDriver_returns400() throws Exception {
        when(bookingService.approveBooking(eq(1L), eq(USER_EMAIL)))
                .thenThrow(new RuntimeException("Not authorized to approve this booking"));

        mockMvc.perform(put("/api/bookings/1/approve")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Not authorized to approve this booking"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/approve — booking not found returns 400")
    void approveBooking_notFound_returns400() throws Exception {
        when(bookingService.approveBooking(eq(999L), eq(DRIVER_EMAIL)))
                .thenThrow(new RuntimeException("Booking not found"));

        mockMvc.perform(put("/api/bookings/999/approve")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Booking not found"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/approve — no seats left returns 400")
    void approveBooking_noSeatsLeft_returns400() throws Exception {
        when(bookingService.approveBooking(eq(1L), eq(DRIVER_EMAIL)))
                .thenThrow(new RuntimeException("Not enough available seats"));

        mockMvc.perform(put("/api/bookings/1/approve")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Not enough available seats"));
    }

    // ── PUT /api/bookings/{id}/reject ──────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/bookings/{id}/reject — driver rejects, returns REJECTED")
    void rejectBooking_returnsRejected() throws Exception {
        when(bookingService.rejectBooking(eq(1L), eq(DRIVER_EMAIL)))
                .thenReturn(rejectedBooking);

        mockMvc.perform(put("/api/bookings/1/reject")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("REJECTED"));

        verify(bookingService).rejectBooking(1L, DRIVER_EMAIL);
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/reject — non-driver returns 400")
    void rejectBooking_notDriver_returns400() throws Exception {
        when(bookingService.rejectBooking(eq(1L), eq(USER_EMAIL)))
                .thenThrow(new RuntimeException("Not authorized to reject this booking"));

        mockMvc.perform(put("/api/bookings/1/reject")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Not authorized to reject this booking"));
    }

    // ── GET /api/bookings/my ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/bookings/my — returns passenger booking list")
    void getMyBookings_returnsList() throws Exception {
        when(bookingService.getPassengerBookings(USER_EMAIL))
                .thenReturn(List.of(pendingBooking, approvedBooking));

        mockMvc.perform(get("/api/bookings/my")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[1].status").value("APPROVED"));

        verify(bookingService).getPassengerBookings(USER_EMAIL);
    }

    @Test
    @DisplayName("GET /api/bookings/my — empty list when no bookings")
    void getMyBookings_empty_returnsEmptyArray() throws Exception {
        when(bookingService.getPassengerBookings(USER_EMAIL)).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/my")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── GET /api/bookings/trip/{tripId} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/bookings/trip/{tripId} — driver views all bookings for a trip")
    void getTripBookings_returnsAllBookings() throws Exception {
        when(bookingService.getTripBookings(10L))
                .thenReturn(List.of(pendingBooking, approvedBooking, rejectedBooking));

        mockMvc.perform(get("/api/bookings/trip/10")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[1].status").value("APPROVED"))
                .andExpect(jsonPath("$[2].status").value("REJECTED"));

        verify(bookingService).getTripBookings(10L);
    }

    @Test
    @DisplayName("GET /api/bookings/trip/{tripId} — empty when no bookings on trip")
    void getTripBookings_empty_returnsEmptyArray() throws Exception {
        when(bookingService.getTripBookings(10L)).thenReturn(List.of());

        mockMvc.perform(get("/api/bookings/trip/10")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /api/bookings/trip/{tripId} — non-existent trip returns 400")
    void getTripBookings_tripNotFound_returns400() throws Exception {
        when(bookingService.getTripBookings(999L))
                .thenThrow(new RuntimeException("Trip not found"));

        mockMvc.perform(get("/api/bookings/trip/999")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Trip not found"));
    }

    // ── PUT /api/bookings/{id}/cancel ──────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/bookings/{id}/cancel — passenger cancels own booking, returns CANCELLED")
    void cancelBooking_returnsCancelled() throws Exception {
        when(bookingService.cancelBooking(eq(1L), eq(USER_EMAIL)))
                .thenReturn(cancelledBooking);

        mockMvc.perform(put("/api/bookings/1/cancel")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(bookingService).cancelBooking(1L, USER_EMAIL);
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/cancel — wrong user returns 400")
    void cancelBooking_wrongUser_returns400() throws Exception {
        when(bookingService.cancelBooking(eq(1L), eq(DRIVER_EMAIL)))
                .thenThrow(new RuntimeException("Not your booking"));

        mockMvc.perform(put("/api/bookings/1/cancel")
                        .requestAttr("userEmail", DRIVER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Not your booking"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/cancel — booking not found returns 400")
    void cancelBooking_notFound_returns400() throws Exception {
        when(bookingService.cancelBooking(eq(999L), eq(USER_EMAIL)))
                .thenThrow(new RuntimeException("Booking not found"));

        mockMvc.perform(put("/api/bookings/999/cancel")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Booking not found"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/cancel — already cancelled returns 400")
    void cancelBooking_alreadyCancelled_returns400() throws Exception {
        when(bookingService.cancelBooking(eq(1L), eq(USER_EMAIL)))
                .thenThrow(new RuntimeException("Booking is already cancelled"));

        mockMvc.perform(put("/api/bookings/1/cancel")
                        .requestAttr("userEmail", USER_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Booking is already cancelled"));
    }
}
