package com.huyperfume.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyperfume.api.dto.response.ProductResponse;
import com.huyperfume.api.entity.Product;
import com.huyperfume.api.exception.BadRequestException;
import com.huyperfume.api.exception.ResourceNotFoundException;
import com.huyperfume.api.mapper.ProductMapper;
import com.huyperfume.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {
    // Note: In production, replace this with Redis (StringRedisTemplate).
    // For now, using an in-memory map keyed by userId for simplicity.
    // Switch to Redis when Redis is available: redisTemplate.opsForValue().get("cart:" + userId)

    private final Map<Long, Map<Long, Integer>> cartStore = new HashMap<>();
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record CartItem(ProductResponse product, int quantity) {}
    public record CartSummary(List<CartItem> items, double total, int itemCount) {}

    public CartSummary getCart(Long userId) {
        Map<Long, Integer> items = cartStore.getOrDefault(userId, new HashMap<>());
        List<CartItem> cartItems = new ArrayList<>();
        double total = 0;

        for (var entry : items.entrySet()) {
            Product product = productRepository.findById(entry.getKey()).orElse(null);
            if (product != null && product.getStatus()) {
                ProductResponse resp = productMapper.toResponse(product);
                cartItems.add(new CartItem(resp, entry.getValue()));
                total += product.getEffectivePrice() * entry.getValue();
            }
        }

        return new CartSummary(cartItems, total, cartItems.size());
    }

    public CartSummary addItem(Long userId, Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (!product.getStatus()) {
            throw new BadRequestException("Sản phẩm không khả dụng");
        }

        Map<Long, Integer> items = cartStore.computeIfAbsent(userId, k -> new HashMap<>());
        int currentQty = items.getOrDefault(productId, 0);
        int newQty = currentQty + quantity;

        if (newQty > product.getStock()) {
            throw new BadRequestException("Số lượng vượt quá tồn kho (" + product.getStock() + ")");
        }

        items.put(productId, newQty);
        return getCart(userId);
    }

    public CartSummary updateQuantity(Long userId, Long productId, int quantity) {
        Map<Long, Integer> items = cartStore.get(userId);
        if (items == null || !items.containsKey(productId)) {
            throw new ResourceNotFoundException("Cart item", productId);
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (quantity > product.getStock()) {
            throw new BadRequestException("Số lượng vượt quá tồn kho (" + product.getStock() + ")");
        }

        if (quantity <= 0) {
            items.remove(productId);
        } else {
            items.put(productId, quantity);
        }

        return getCart(userId);
    }

    public CartSummary removeItem(Long userId, Long productId) {
        Map<Long, Integer> items = cartStore.get(userId);
        if (items != null) {
            items.remove(productId);
        }
        return getCart(userId);
    }

    public void clearCart(Long userId) {
        cartStore.remove(userId);
    }

    public Map<Long, Integer> getCartItems(Long userId) {
        return cartStore.getOrDefault(userId, new HashMap<>());
    }
}
