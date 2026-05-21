package com.huyperfume.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class JwtResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;
    private String role;
}
