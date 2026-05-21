package com.huyperfume.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String sku;
    private String batchCode;
    private String name;
    private Double price;
    private Double discountPrice;
    private String image;
    private String description;
    private String scentNotes;
    private Boolean isDecant;
    private Boolean status;
    private Integer stock;
    private Integer volumeMl;
    private CategoryInfo category;
    private BrandInfo brand;

    @Data
    @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategoryInfo {
        private Integer id;
        private String name;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BrandInfo {
        private Integer id;
        private String name;
    }
}
