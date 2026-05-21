package com.huyperfume.api.controller;

import com.huyperfume.api.entity.Category;
import com.huyperfume.api.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "API danh mục sản phẩm")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Tất cả danh mục")
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết danh mục")
    public ResponseEntity<Category> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryRepository.findById(id).orElse(null));
    }
}
