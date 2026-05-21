package com.huyperfume.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class HuyPerfumeApplication {

    public static void main(String[] args) {
        SpringApplication.run(HuyPerfumeApplication.class, args);
    }
}
