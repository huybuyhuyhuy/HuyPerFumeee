package com.huyperfume.api.controller;

import com.huyperfume.api.dto.request.CheckoutRequest;
import com.huyperfume.api.dto.response.OrderResponse;
import com.huyperfume.api.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "API đơn hàng")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Đặt hàng", description = "Tạo đơn hàng từ giỏ hàng hiện tại")
    public ResponseEntity<OrderResponse> checkout(Authentication auth,
                                                   @Valid @RequestBody CheckoutRequest request) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(orderService.checkout(userId, request));
    }

    @GetMapping
    @Operation(summary = "Lịch sử đơn hàng")
    public ResponseEntity<Page<OrderResponse>> getUserOrders(
            Authentication auth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(orderService.getUserOrders(userId, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đơn hàng")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng")
    public ResponseEntity<Void> cancelOrder(Authentication auth, @PathVariable Long id) {
        Long userId = Long.valueOf(auth.getName());
        orderService.cancelOrder(userId, id);
        return ResponseEntity.noContent().build();
    }
}
