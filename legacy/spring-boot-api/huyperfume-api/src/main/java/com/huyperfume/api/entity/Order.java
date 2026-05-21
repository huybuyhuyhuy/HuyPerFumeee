package com.huyperfume.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double total;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(length = 20)
    private String phone;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "momo_order_id", length = 120)
    private String momoOrderId;

    @Column(name = "momo_trans_id", length = 120)
    private String momoTransId;

    @Column(name = "zalopay_app_trans_id", length = 120)
    private String zalopayAppTransId;

    @Column(length = 50)
    @Builder.Default
    private String status = "Waiting";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null || status.isBlank()) status = "Waiting";
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
