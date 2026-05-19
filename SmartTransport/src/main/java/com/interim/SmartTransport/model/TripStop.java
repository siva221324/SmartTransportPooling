package com.interim.SmartTransport.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_stops")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    @JsonIgnore
    private Trip trip;

    @Column(nullable = false)
    private String stopName;

    private Double lat;
    private Double lng;

    @Column(nullable = false)
    private int stopOrder;
}
