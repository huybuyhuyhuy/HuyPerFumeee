package com.huyperfume.api.controller;

import com.huyperfume.api.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "API giỏ hàng")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Xem giỏ hàng")
    public ResponseEntity<CartService.CartSummary> getCart(Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/items")
    @Operation(summary = "Thêm vào giỏ hàng")
    public ResponseEntity<CartService.CartSummary> addItem(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(auth.getName());
        Long productId = ((Number) body.get("productId")).longValue();
        int quantity = body.containsKey("quantity") ? ((Number) body.get("quantity")).intValue() : 1;
        return ResponseEntity.ok(cartService.addItem(userId, productId, quantity));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Cập nhật số lượng")
    public ResponseEntity<CartService.CartSummary> updateQuantity(
            Authentication auth,
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(auth.getName());
        int quantity = ((Number) body.get("quantity")).intValue();
        return ResponseEntity.ok(cartService.updateQuantity(userId, productId, quantity));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Xóa sản phẩm khỏi giỏ hàng")
    public ResponseEntity<CartService.CartSummary> removeItem(
            Authentication auth,
            @PathVariable Long productId) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(cartService.removeItem(userId, productId));
    }

    @DeleteMapping
    @Operation(summary = "Xóa toàn bộ giỏ hàng")
    public ResponseEntity<Void> clearCart(Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
