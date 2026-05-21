package com.huyperfume.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckoutRequest {
    private String shippingAddress;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // COD, Momo, ZaloPay
}
