package data.utils;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class ZaloPayPaymentHelper {
    private ZaloPayPaymentHelper() {}

    public static String createPayment(long amountVnd, int orderId, String appUser, String redirectUrl) throws Exception {
        String appTransId = new SimpleDateFormat("yyMMdd").format(new Date()) + "_" + orderId + "_" + System.currentTimeMillis();
        long appTime = System.currentTimeMillis();
        String itemJson = "[]";
        String embedData = "{\"redirecturl\":\"" + escapeJson(redirectUrl) + "\"}";
        String description = "Thanh toan don hang #" + orderId;

        String data = ZaloPayConfig.APP_ID + "|" + appTransId + "|" + appUser + "|" + amountVnd + "|" + appTime + "|" + embedData + "|" + itemJson;
        String mac = hmacSHA256(data, ZaloPayConfig.KEY1);

        StringBuilder form = new StringBuilder();
        appendForm(form, "app_id", String.valueOf(ZaloPayConfig.APP_ID));
        appendForm(form, "app_user", appUser);
        appendForm(form, "app_time", String.valueOf(appTime));
        appendForm(form, "amount", String.valueOf(amountVnd));
        appendForm(form, "app_trans_id", appTransId);
        appendForm(form, "embed_data", embedData);
        appendForm(form, "item", itemJson);
        appendForm(form, "description", description);
        appendForm(form, "bank_code", "");
        appendForm(form, "mac", mac);

        URL url = new URL(ZaloPayConfig.ENDPOINT_CREATE);
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
            while ((line = br.readLine()) != null) {
                response.append(line);
            }
        }

        JsonObject obj = JsonParser.parseString(response.toString()).getAsJsonObject();
        int returnCode = obj.has("return_code") ? obj.get("return_code").getAsInt() : -1;
        if (returnCode != 1) {
            String msg = obj.has("return_message") ? obj.get("return_message").getAsString() : response.toString();
            throw new IllegalStateException("ZaloPay create thất bại: " + msg);
        }
        if (!obj.has("order_url")) {
            throw new IllegalStateException("ZaloPay không trả order_url.");
        }
        return obj.get("order_url").getAsString();
    }

    private static void appendForm(StringBuilder sb, String key, String value) throws Exception {
        if (sb.length() > 0) sb.append("&");
        sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8.name()))
                .append("=")
                .append(URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8.name()));
    }

    private static String hmacSHA256(String data, String key) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) sb.append('0');
            sb.append(h);
        }
        return sb.toString();
    }

    private static String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
