package com.huyperfume.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    private String emailPhone;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
