package com.huyperfume.api.repository;

import com.huyperfume.api.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Order> findByMomoOrderId(String momoOrderId);

    Optional<Order> findByZalopayAppTransId(String zalopayAppTransId);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    Page<Order> findAllOrdered(Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN :statuses")
    double sumTotalByStatusIn(@Param("statuses") List<String> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status NOT IN ('Cancelled', 'Waiting')")
    long countCompletedOrders();
}
