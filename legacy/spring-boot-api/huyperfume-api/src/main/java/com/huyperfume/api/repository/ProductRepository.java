package com.huyperfume.api.repository;

import com.huyperfume.api.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByStatusTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndStatusTrue(Integer categoryId, Pageable pageable);

    Page<Product> findByBrandIdAndStatusTrue(Integer brandId, Pageable pageable);

    Page<Product> findByCategoryIdAndBrandIdAndStatusTrue(Integer categoryId, Integer brandId, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCaseAndStatusTrue(String name, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = true AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findWithFilters(@Param("categoryId") Integer categoryId,
                                  @Param("brandId") Integer brandId,
                                  @Param("search") String search,
                                  Pageable pageable);

    Optional<Product> findBySku(String sku);

    List<Product> findByCategoryId(Integer categoryId);

    List<Product> findByBrandId(Integer brandId);

    List<Product> findByIsDecantTrueAndStatusTrue();

    long countByStatusTrue();

    @Query("SELECT p FROM Product p LEFT JOIN OrderItem oi ON oi.product = p " +
           "WHERE p.status = true GROUP BY p ORDER BY SUM(oi.quantity) DESC")
    List<Product> findTopSelling(Pageable pageable);
}
