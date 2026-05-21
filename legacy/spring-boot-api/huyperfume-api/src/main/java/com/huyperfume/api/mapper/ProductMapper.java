package com.huyperfume.api.mapper;

import com.huyperfume.api.dto.response.ProductResponse;
import com.huyperfume.api.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) return null;

        ProductResponse.CategoryInfo catInfo = null;
        if (product.getCategory() != null) {
            catInfo = ProductResponse.CategoryInfo.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .build();
        }

        ProductResponse.BrandInfo brandInfo = null;
        if (product.getBrand() != null) {
            brandInfo = ProductResponse.BrandInfo.builder()
                    .id(product.getBrand().getId())
                    .name(product.getBrand().getName())
                    .build();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .batchCode(product.getBatchCode())
                .name(product.getName())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .image(product.getImage())
                .description(product.getDescription())
                .scentNotes(product.getScentNotes())
                .isDecant(product.getIsDecant())
                .status(product.getStatus())
                .stock(product.getStock())
                .volumeMl(product.getVolumeMl())
                .category(catInfo)
                .brand(brandInfo)
                .build();
    }
}
