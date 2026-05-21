package com.huyperfume.api.controller;

import com.huyperfume.api.entity.Brand;
import com.huyperfume.api.repository.BrandRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
@Tag(name = "Brands", description = "API thương hiệu")
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    @Operation(summary = "Tất cả thương hiệu đang hoạt động")
    public ResponseEntity<List<Brand>> getAll() {
        return ResponseEntity.ok(brandRepository.findByStatusTrue());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết thương hiệu")
    public ResponseEntity<Brand> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(brandRepository.findById(id).orElse(null));
    }
}
