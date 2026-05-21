package com.huyperfume.api.service;

import com.huyperfume.api.dto.request.LoginRequest;
import com.huyperfume.api.dto.request.RegisterRequest;
import com.huyperfume.api.dto.response.JwtResponse;
import com.huyperfume.api.entity.User;
import com.huyperfume.api.exception.BadRequestException;
import com.huyperfume.api.repository.UserRepository;
import com.huyperfume.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getEmailPhone())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không đúng"));

        if (!verifyPassword(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email hoặc mật khẩu không đúng");
        }

        // Upgrade MD5 to BCrypt on successful login
        if (!isBCryptHash(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        return JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public JwtResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getRepassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .role("user")
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        return JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private boolean verifyPassword(String rawPassword, String storedHash) {
        if (isBCryptHash(storedHash)) {
            return passwordEncoder.matches(rawPassword, storedHash);
        }
        // Legacy MD5 verification
        return md5(rawPassword).equalsIgnoreCase(storedHash);
    }

    private boolean isBCryptHash(String hash) {
        return hash != null && (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$"));
    }

    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 not available", e);
        }
    }
}
