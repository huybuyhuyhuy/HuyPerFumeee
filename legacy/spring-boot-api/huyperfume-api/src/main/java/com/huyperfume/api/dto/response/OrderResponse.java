package com.huyperfume.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Double total;
    private String shippingAddress;
    private String phone;
    private String paymentMethod;
    private String momoOrderId;
    private String momoTransId;
    private String zalopayAppTransId;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderItemInfo> items;
    private String paymentUrl;

    @Data
    @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OrderItemInfo {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private int quantity;
        private double price;
        private String selectedBatchCode;
        private double priceAtPurchase;
    }
}
