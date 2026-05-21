package com.huyperfume.api.service;

import com.huyperfume.api.dto.request.CheckoutRequest;
import com.huyperfume.api.dto.response.OrderResponse;
import com.huyperfume.api.entity.Order;
import com.huyperfume.api.entity.OrderItem;
import com.huyperfume.api.entity.Product;
import com.huyperfume.api.entity.User;
import com.huyperfume.api.exception.BadRequestException;
import com.huyperfume.api.exception.ResourceNotFoundException;
import com.huyperfume.api.repository.OrderRepository;
import com.huyperfume.api.repository.ProductRepository;
import com.huyperfume.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final PaymentService paymentService;

    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        CartService.CartSummary cart = cartService.getCart(userId);
        if (cart.items().isEmpty()) {
            throw new BadRequestException("Giỏ hàng trống");
        }

        // Validate stock
        for (var cartItem : cart.items()) {
            Product product = productRepository.findById(cartItem.product().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", cartItem.product().getId()));
            if (product.getStock() < cartItem.quantity()) {
                throw new BadRequestException("Sản phẩm " + product.getName() + " không đủ hàng (còn " + product.getStock() + ")");
            }
        }

        // Create order
        Order order = Order.builder()
                .user(user)
                .total(cart.total())
                .shippingAddress(request.getShippingAddress() != null ? request.getShippingAddress() : user.getAddress())
                .phone(request.getPhone())
                .paymentMethod(request.getPaymentMethod())
                .status("Waiting")
                .build();

        // Add order items and deduct stock
        for (var cartItem : cart.items()) {
            Product product = productRepository.findById(cartItem.product().getId()).get();
            product.setStock(product.getStock() - cartItem.quantity());
            productRepository.save(product);

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(cartItem.quantity())
                    .price(product.getEffectivePrice())
                    .priceAtPurchase(product.getEffectivePrice())
                    .selectedBatchCode(product.getBatchCode())
                    .status("Normal")
                    .build();
            order.addItem(item);
        }

        order = orderRepository.save(order);
        cartService.clearCart(userId);

        OrderResponse response = mapToResponse(order);

        // Handle payment gateway
        if ("Momo".equals(request.getPaymentMethod())) {
            try {
                long amountVnd = Math.round(order.getTotal());
                String payUrl = paymentService.createMomoPayment(amountVnd, order.getId(), user);
                order.setMomoOrderId(paymentService.getLastMomoOrderId());
                orderRepository.save(order);
                response.setPaymentUrl(payUrl);
            } catch (Exception e) {
                throw new RuntimeException("Không tạo được link MoMo: " + e.getMessage(), e);
            }
        } else if ("ZaloPay".equals(request.getPaymentMethod())) {
            try {
                long amountVnd = Math.round(order.getTotal());
                String payUrl = paymentService.createZaloPayPayment(amountVnd, order.getId(), user);
                order.setZalopayAppTransId(paymentService.getLastZaloPayTransId());
                orderRepository.save(order);
                response.setPaymentUrl(payUrl);
            } catch (Exception e) {
                throw new RuntimeException("Không tạo được link ZaloPay: " + e.getMessage(), e);
            }
        }

        return response;
    }

    public Page<OrderResponse> getUserOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setStatus(status);
        return mapToResponse(orderRepository.save(order));
    }

    @Transactional
    public void cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền hủy đơn hàng này");
        }
        if (!"Waiting".equals(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đang chờ xử lý");
        }

        // Restore stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus("Cancelled");
        orderRepository.save(order);
    }

    public Page<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        return orderRepository.findAllOrdered(pageable).map(this::mapToResponse);
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderResponse.OrderItemInfo> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemInfo.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImage(item.getProduct().getImage())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .selectedBatchCode(item.getSelectedBatchCode())
                        .priceAtPurchase(item.getPriceAtPurchase())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userName(order.getUser().getName())
                .total(order.getTotal())
                .shippingAddress(order.getShippingAddress())
                .phone(order.getPhone())
                .paymentMethod(order.getPaymentMethod())
                .momoOrderId(order.getMomoOrderId())
                .momoTransId(order.getMomoTransId())
                .zalopayAppTransId(order.getZalopayAppTransId())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
