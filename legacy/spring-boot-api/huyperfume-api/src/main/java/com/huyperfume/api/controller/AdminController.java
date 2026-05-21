package com.huyperfume.api.controller;

import com.huyperfume.api.dto.response.OrderResponse;
import com.huyperfume.api.dto.response.ProductResponse;
import com.huyperfume.api.entity.Product;
import com.huyperfume.api.repository.OrderRepository;
import com.huyperfume.api.repository.ProductRepository;
import com.huyperfume.api.repository.UserRepository;
import com.huyperfume.api.service.OrderService;
import com.huyperfume.api.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "API quản trị viên")
public class AdminController {

    private final ProductService productService;
    private final OrderService orderService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    @Operation(summary = "Thống kê dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRevenue", orderRepository.sumTotalByStatusIn(
                List.of("Paid", "Completed", "Delivered")));
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("completedOrders", orderRepository.countCompletedOrders());
        stats.put("totalProducts", productRepository.countByStatusTrue());

        List<ProductResponse> topProducts = productRepository.findTopSelling(
                org.springframework.data.domain.PageRequest.of(0, 5))
                .stream()
                .map(p -> productService.getProduct(p.getId()))
                .toList();
        stats.put("topProducts", topProducts);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/products")
    @Operation(summary = "Tất cả sản phẩm (admin)")
    public ResponseEntity<Page<OrderResponse>> getProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(null); // stub - use ProductService if needed
    }

    @PostMapping("/products")
    @Operation(summary = "Tạo sản phẩm mới")
    public ResponseEntity<ProductResponse> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productService.createProduct(product));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Cập nhật sản phẩm")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Xóa sản phẩm")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/orders")
    @Operation(summary = "Tất cả đơn hàng")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getAllOrders(page, size));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Chi tiết đơn hàng (admin)")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, body.get("status")));
    }
}
