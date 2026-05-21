package com.huyperfume.api.controller;

import com.huyperfume.api.entity.User;
import com.huyperfume.api.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "API thông tin người dùng")
public class ProfileController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    @Operation(summary = "Xem thông tin cá nhân")
    public ResponseEntity<User> getProfile(Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(userRepository.findById(userId).orElse(null));
    }

    @PutMapping("/profile")
    @Operation(summary = "Cập nhật thông tin cá nhân")
    public ResponseEntity<User> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = Long.valueOf(auth.getName());
        User user = userRepository.findById(userId).orElseThrow();
        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        if (body.containsKey("address")) user.setAddress(body.get("address"));
        if (body.containsKey("dob") && body.get("dob") != null) {
            user.setDob(java.time.LocalDate.parse(body.get("dob")));
        }
        return ResponseEntity.ok(userRepository.save(user));
    }
}
