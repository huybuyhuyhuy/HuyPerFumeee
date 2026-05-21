package com.huyperfume.api.controller;

import com.huyperfume.api.dto.response.PagedResponse;
import com.huyperfume.api.dto.response.ProductResponse;
import com.huyperfume.api.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "API sản phẩm")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Danh sách sản phẩm", description = "Lấy danh sách sản phẩm có phân trang, lọc, sắp xếp")
    public ResponseEntity<PagedResponse<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId,
            @RequestParam(required = false) String priceRange,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productService.getProducts(page, size, sort, categoryId, brandId, priceRange, search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm sản phẩm")
    public ResponseEntity<List<ProductResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(productService.searchProducts(q));
    }

    @GetMapping("/decant")
    @Operation(summary = "Danh sách nước hoa chiết")
    public ResponseEntity<List<ProductResponse>> getDecantProducts() {
        return ResponseEntity.ok(productService.getDecantProducts());
    }

    @GetMapping("/by-category/{categoryId}")
    @Operation(summary = "Sản phẩm theo danh mục")
    public ResponseEntity<List<ProductResponse>> getByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    @GetMapping("/by-brand/{brandId}")
    @Operation(summary = "Sản phẩm theo thương hiệu")
    public ResponseEntity<List<ProductResponse>> getByBrand(@PathVariable Integer brandId) {
        return ResponseEntity.ok(productService.getProductsByBrand(brandId));
    }
}
