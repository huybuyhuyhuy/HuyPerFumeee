package com.huyperfume.api.service;

import com.huyperfume.api.config.AppConfig;
import com.huyperfume.api.entity.Order;
import com.huyperfume.api.entity.User;
import com.huyperfume.api.exception.BadRequestException;
import com.huyperfume.api.exception.ResourceNotFoundException;
import com.huyperfume.api.repository.OrderRepository;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final AppConfig appConfig;
    private final OrderRepository orderRepository;
    private String lastMomoOrderId;
    private String lastZaloPayTransId;

    public String getLastMomoOrderId() { return lastMomoOrderId; }
    public String getLastZaloPayTransId() { return lastZaloPayTransId; }

    public String createMomoPayment(long amountVnd, Long orderId, User user) throws Exception {
        AppConfig.Momo momo = appConfig.getMomo();
        if (amountVnd < momo.getMinAmountVnd()) {
            amountVnd = momo.getMinAmountVnd();
        }

        String momoOrderId = momo.getPartnerCode() + System.currentTimeMillis();
        String orderInfo = "Thanh toan don hang #" + orderId;
        String requestId = momoOrderId;

        // Build raw signature
        String baseUrl = "http://localhost:8080";
        String redirectUrl = baseUrl + "/api/payments/momo-return";
        String ipnUrl = baseUrl + "/api/payments/momo-ipn";

        String rawSignature = "accessKey=" + momo.getAccessKey()
                + "&amount=" + amountVnd
                + "&extraData=" + momo.getExtraData()
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + momoOrderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momo.getPartnerCode()
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + momo.getRequestType();

        String signature = hmacSha256(rawSignature, momo.getSecretKey());

        String jsonBody = "{"
                + "\"partnerCode\":\"" + momo.getPartnerCode() + "\","
                + "\"partnerName\":\"" + escapeJson(momo.getPartnerName()) + "\","
                + "\"storeId\":\"" + momo.getStoreId() + "\","
                + "\"requestId\":\"" + requestId + "\","
                + "\"amount\":" + amountVnd + ","
                + "\"orderId\":\"" + momoOrderId + "\","
                + "\"orderInfo\":\"" + escapeJson(orderInfo) + "\","
                + "\"redirectUrl\":\"" + escapeJson(redirectUrl) + "\","
                + "\"ipnUrl\":\"" + escapeJson(ipnUrl) + "\","
                + "\"lang\":\"" + momo.getLang() + "\","
                + "\"requestType\":\"" + momo.getRequestType() + "\","
                + "\"autoCapture\":" + momo.isAutoCapture() + ","
                + "\"extraData\":\"" + momo.getExtraData() + "\","
                + "\"orderGroupId\":\"" + momo.getOrderGroupId() + "\","
                + "\"signature\":\"" + signature + "\""
                + "}";

        URL url = new URL(momo.getCreateEndpoint());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);
        byte[] out = jsonBody.getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(out);
        }

        int code = conn.getResponseCode();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        String response = sb.toString();

        String payUrl = extractJsonString(response, "payUrl");
        if (payUrl == null || payUrl.isEmpty()) {
            throw new IllegalStateException("MoMo không trả payUrl: " + response);
        }

        this.lastMomoOrderId = momoOrderId;
        return payUrl;
    }

    public String createZaloPayPayment(long amountVnd, Long orderId, User user) throws Exception {
        AppConfig.ZaloPay zp = appConfig.getZalopay();
        String appTransId = new SimpleDateFormat("yyMMdd").format(new Date()) + "_" + orderId + "_" + System.currentTimeMillis();
        long appTime = System.currentTimeMillis();
        String appUser = (user.getEmail() != null && !user.getEmail().isBlank()) ? user.getEmail() : ("guest_" + orderId);
        String embedData = "{}";
        String itemJson = "[]";
        String description = "Thanh toan don hang #" + orderId;

        String data = zp.getAppId() + "|" + appTransId + "|" + appUser + "|" + amountVnd + "|" + appTime + "|" + embedData + "|" + itemJson;
        String mac = hmacSha256(data, zp.getKey1());

        StringBuilder form = new StringBuilder();
        appendForm(form, "app_id", String.valueOf(zp.getAppId()));
        appendForm(form, "app_user", appUser);
        appendForm(form, "app_time", String.valueOf(appTime));
        appendForm(form, "amount", String.valueOf(amountVnd));
        appendForm(form, "app_trans_id", appTransId);
        appendForm(form, "embed_data", embedData);
        appendForm(form, "item", itemJson);
        appendForm(form, "description", description);
        appendForm(form, "bank_code", "");
        appendForm(form, "mac", mac);

        URL url = new URL(zp.getEndpointCreate());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setDoOutput(true);
        byte[] payload = form.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload);
        }

        int code = conn.getResponseCode();
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) response.append(line);
        }

        JsonObject obj = JsonParser.parseString(response.toString()).getAsJsonObject();
        int returnCode = obj.has("return_code") ? obj.get("return_code").getAsInt() : -1;
        if (returnCode != 1) {
            String msg = obj.has("return_message") ? obj.get("return_message").getAsString() : response.toString();
            throw new IllegalStateException("ZaloPay create thất bại: " + msg);
        }

        this.lastZaloPayTransId = appTransId;
        return obj.get("order_url").getAsString();
    }

    public void verifyMomoIpn(JsonObject body) throws Exception {
        AppConfig.Momo momo = appConfig.getMomo();
        String rawSignature = "accessKey=" + getStr(body, "accessKey")
                + "&amount=" + getStr(body, "amount")
                + "&extraData=" + getStr(body, "extraData")
                + "&message=" + getStr(body, "message")
                + "&orderId=" + getStr(body, "orderId")
                + "&orderInfo=" + getStr(body, "orderInfo")
                + "&orderType=" + getStr(body, "orderType")
                + "&partnerCode=" + getStr(body, "partnerCode")
                + "&payType=" + getStr(body, "payType")
                + "&requestId=" + getStr(body, "requestId")
                + "&responseTime=" + getStr(body, "responseTime")
                + "&resultCode=" + getStr(body, "resultCode")
                + "&transId=" + getStr(body, "transId");
        String expectedSig = hmacSha256(rawSignature, momo.getSecretKey());
        String receivedSig = getStr(body, "signature");

        if (!expectedSig.equals(receivedSig)) {
            throw new BadRequestException("Invalid MoMo IPN signature");
        }

        String momoOrderId = getStr(body, "orderId");
        Order order = orderRepository.findByMomoOrderId(momoOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "momoOrderId", momoOrderId));

        int resultCode = Integer.parseInt(getStr(body, "resultCode"));
        if (resultCode == 0) {
            order.setStatus("Paid");
            order.setMomoTransId(getStr(body, "transId"));
            orderRepository.save(order);
        }
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) hex.append('0');
            hex.append(h);
        }
        return hex.toString();
    }

    private String extractJsonString(String json, String key) {
        String searchKey = "\"" + key + "\":\"";
        int i = json.indexOf(searchKey);
        if (i < 0) {
            searchKey = "\"" + key + "\": \"";
            i = json.indexOf(searchKey);
        }
        if (i < 0) return null;
        int start = i + searchKey.length();
        StringBuilder sb = new StringBuilder();
        for (int p = start; p < json.length(); p++) {
            char c = json.charAt(p);
            if (c == '\\' && p + 1 < json.length()) {
                char n = json.charAt(p + 1);
                if (n == '/' || n == '\\') { sb.append(n == '/' ? '/' : '\\'); p++; continue; }
            }
            if (c == '"') break;
            sb.append(c);
        }
        return sb.toString().replace("\\/", "/");
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void appendForm(StringBuilder sb, String key, String value) throws Exception {
        if (sb.length() > 0) sb.append("&");
        sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8))
          .append("=")
          .append(URLEncoder.encode(value != null ? value : "", StandardCharsets.UTF_8));
    }

    private String getStr(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}
