package com.huyperfume.api.controller;

import com.huyperfume.api.dto.request.LoginRequest;
import com.huyperfume.api.dto.request.RegisterRequest;
import com.huyperfume.api.dto.response.ApiError;
import com.huyperfume.api.dto.response.JwtResponse;
import com.huyperfume.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Đăng ký, đăng nhập")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Đăng nhập bằng email hoặc số điện thoại và mật khẩu")
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công")
    @ApiResponse(responseCode = "400", description = "Sai thông tin đăng nhập",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký", description = "Tạo tài khoản mới")
    @ApiResponse(responseCode = "200", description = "Đăng ký thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
