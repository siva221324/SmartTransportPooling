package com.interim.SmartTransport.model;

import com.interim.SmartTransport.model.enums.ApprovalMode;
import com.interim.SmartTransport.model.enums.TripStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    private Double originLat;
    private Double originLng;
    private Double destLat;
    private Double destLng;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private int availableSeats;

    private BigDecimal pricePerSeat;

    private BigDecimal dailyRate;

    @Column(nullable = false)
    @Builder.Default
    private boolean recurring = false;

    private String recurringDays; // e.g. "MON,TUE,WED,THU,FRI"

    private String recurringGroupId; // UUID linking sibling recurring trips

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApprovalMode approvalMode = ApprovalMode.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.SCHEDULED;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stopOrder ASC")
    @Builder.Default
    private List<TripStop> stops = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

