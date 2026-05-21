package com.huyperfume.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brand")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    private Boolean status = true;

    @JsonIgnore
    @OneToMany(mappedBy = "brand", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Product> products = new ArrayList<>();
}
