package com.huyperfume.api.repository;

import com.huyperfume.api.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {

    List<Brand> findByStatusTrue();
}
