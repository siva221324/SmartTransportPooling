package com.interim.SmartTransport.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganizationRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String emailDomain;
    private boolean whitelisted = true;
}

