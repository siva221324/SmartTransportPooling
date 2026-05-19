package com.interim.SmartTransport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SendMessageRequest {
    @NotBlank
    @Size(max = 1000)
    private String content;
}
