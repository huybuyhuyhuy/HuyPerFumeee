package com.huyperfume.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppConfig {
    private Jwt jwt = new Jwt();
    private Momo momo = new Momo();
    private ZaloPay zalopay = new ZaloPay();

    @Data
    public static class Jwt {
        private String secret;
        private long expirationMs;
        private long refreshExpirationMs;
    }

    @Data
    public static class Momo {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String createEndpoint;
        private boolean useNodeProxy;
        private String nodePaymentUrl;
        private String nodeRefundUrl;
        private long minAmountVnd;
        private String storeId;
        private String partnerName;
        private String requestType;
        private String lang;
        private boolean autoCapture;
        private String extraData;
        private String orderGroupId;
    }

    @Data
    public static class ZaloPay {
        private int appId;
        private String key1;
        private String key2;
        private String endpointCreate;
    }
}
