package com.huyperfume.api.controller;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.huyperfume.api.repository.OrderRepository;
import com.huyperfume.api.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment callbacks từ MoMo và ZaloPay")
public class PaymentController {
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private final PaymentService paymentService;
    private final OrderRepository orderRepository;

    @GetMapping("/momo-return")
    @Operation(summary = "MoMo redirect về sau thanh toán")
    public ResponseEntity<String> momoReturn(@RequestParam(required = false) String orderId,
                                              @RequestParam(required = false) String resultCode,
                                              @RequestParam(required = false) String message) {
        log.info("MoMo return: orderId={}, resultCode={}, message={}", orderId, resultCode, message);
        if ("0".equals(resultCode)) {
            return ResponseEntity.ok("<html><body><script>window.close();</script><h3>Thanh toan thanh cong! Ban co the dong tab nay.</h3></body></html>");
        }
        return ResponseEntity.ok("<html><body><script>window.close();</script><h3>Thanh toan that bai: " + message + "</h3></body></html>");
    }

    @PostMapping("/momo-ipn")
    @Operation(summary = "MoMo IPN callback (server-to-server)")
    public ResponseEntity<?> momoIpn(HttpServletRequest request) {
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
            }
            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();
            log.info("MoMo IPN: {}", body.toString());
            paymentService.verifyMomoIpn(body);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("MoMo IPN error", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/zalopay-return")
    @Operation(summary = "ZaloPay redirect về sau thanh toán")
    public ResponseEntity<String> zalopayReturn(@RequestParam(required = false) String apptransid,
                                                 @RequestParam(required = false) String status) {
        log.info("ZaloPay return: apptransid={}, status={}", apptransid, status);
        if ("1".equals(status) && apptransid != null) {
            orderRepository.findByZalopayAppTransId(apptransid).ifPresent(order -> {
                order.setStatus("Paid");
                orderRepository.save(order);
            });
            return ResponseEntity.ok("<html><body><script>window.close();</script><h3>Thanh toan thanh cong!</h3></body></html>");
        }
        return ResponseEntity.ok("<html><body><script>window.close();</script><h3>Thanh toan that bai!</h3></body></html>");
    }
}
