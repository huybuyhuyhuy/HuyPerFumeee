package com.huyperfume.api.service;

import com.huyperfume.api.dto.response.PagedResponse;
import com.huyperfume.api.dto.response.ProductResponse;
import com.huyperfume.api.entity.Product;
import com.huyperfume.api.exception.ResourceNotFoundException;
import com.huyperfume.api.mapper.ProductMapper;
import com.huyperfume.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Cacheable(value = "product_detail", key = "#id")
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(product);
    }

    public PagedResponse<ProductResponse> getProducts(int page, int size, String sort,
                                                       Integer categoryId, Integer brandId,
                                                       String priceRange, String search) {
        Sort sorting;
        switch (sort != null ? sort : "newest") {
            case "price_asc":
                sorting = Sort.by("discountPrice").ascending().and(Sort.by("price").ascending());
                break;
            case "price_desc":
                sorting = Sort.by("discountPrice").descending().and(Sort.by("price").descending());
                break;
            default:
                sorting = Sort.by("id").descending();
        }

        Pageable pageable = PageRequest.of(page - 1, size, sorting);
        Page<Product> productPage = productRepository.findWithFilters(categoryId, brandId, search, pageable);

        List<ProductResponse> content = productPage.getContent().stream()
                .map(productMapper::toResponse)
                .toList();

        // If price range filter is specified, apply in-memory filtering
        if (priceRange != null && !priceRange.isBlank()) {
            content = content.stream()
                    .filter(p -> matchesPriceRange(p.getDiscountPrice() > 0 ? p.getDiscountPrice() : p.getPrice(), priceRange))
                    .toList();
        }

        return PagedResponse.<ProductResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .first(productPage.isFirst())
                .build();
    }

    public List<ProductResponse> getProductsByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByBrand(Integer brandId) {
        return productRepository.findByBrandId(brandId).stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getDecantProducts() {
        return productRepository.findByIsDecantTrueAndStatusTrue().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> searchProducts(String query) {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("id").descending());
        return productRepository.findByNameContainingIgnoreCaseAndStatusTrue(query, pageable)
                .getContent().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(value = {"products", "product_detail", "dashboard", "top_products"}, allEntries = true)
    public ProductResponse createProduct(Product product) {
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"products", "product_detail", "dashboard", "top_products"}, allEntries = true)
    public ProductResponse updateProduct(Long id, Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setSku(updated.getSku());
        product.setBatchCode(updated.getBatchCode());
        product.setName(updated.getName());
        product.setPrice(updated.getPrice());
        product.setDiscountPrice(updated.getDiscountPrice());
        product.setImage(updated.getImage());
        product.setScentNotes(updated.getScentNotes());
        product.setIsDecant(updated.getIsDecant());
        product.setStatus(updated.getStatus());
        product.setCategory(updated.getCategory());
        product.setBrand(updated.getBrand());
        product.setStock(updated.getStock());
        product.setVolumeMl(updated.getVolumeMl());
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    @CacheEvict(value = {"products", "product_detail", "dashboard", "top_products"}, allEntries = true)
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", id);
        }
        productRepository.deleteById(id);
    }

    private boolean matchesPriceRange(double price, String range) {
        return switch (range) {
            case "under500" -> price < 500000;
            case "500to1000" -> price >= 500000 && price <= 1000000;
            case "1000to2000" -> price >= 1000000 && price <= 2000000;
            case "above2000" -> price > 2000000;
            default -> true;
        };
    }
}
