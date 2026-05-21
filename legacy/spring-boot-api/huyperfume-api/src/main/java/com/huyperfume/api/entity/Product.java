package com.huyperfume.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, unique = true)
    private String sku;

    @Column(name = "batch_code", length = 100)
    private String batchCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(name = "discount_price")
    @Builder.Default
    private Double discountPrice = 0.0;

    @Column(length = 500)
    private String image;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "scent_notes", columnDefinition = "TEXT")
    private String scentNotes;

    @Column(name = "is_decant")
    @Builder.Default
    private Boolean isDecant = false;

    @Builder.Default
    private Boolean status = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_category")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_brand")
    private Brand brand;

    @Builder.Default
    private Integer stock = 0;

    @Column(name = "volume_ml")
    @Builder.Default
    private Integer volumeMl = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (discountPrice == null) discountPrice = 0.0;
        if (stock == null) stock = 0;
        if (status == null) status = true;
        if (isDecant == null) isDecant = false;
        if (volumeMl == null) volumeMl = 0;
    }

    public double getEffectivePrice() {
        return discountPrice != null && discountPrice > 0 ? discountPrice : price;
    }
}
