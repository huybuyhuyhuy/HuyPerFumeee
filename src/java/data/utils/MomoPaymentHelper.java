package data.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import com.google.gson.JsonObject;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Tạo giao dịch MoMo (gateway create) – giống logic demo momo/server.js.
 * Không cần Node.js chạy song song.
 */
public final class MomoPaymentHelper {

    private MomoPaymentHelper() {}

    /**
     * @param amountVnd   Số tiền VND (nguyên, không lẻ)
     * @param orderId     Mã đơn hàng gửi lên MoMo (duy nhất mỗi lần)
     * @param orderInfo   Mô tả
     * @param redirectUrl URL trình duyệt quay lại sau khi thanh toán
     * @param ipnUrl      URL MoMo gọi server-to-server (localhost cần ngrok mới nhận được)
     * @return payUrl để redirect người dùng
     */
    public static String createPayment(long amountVnd, String orderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {

        String requestId = orderId;
        String amountStr = String.valueOf(amountVnd);

        String rawSignature =
                "accessKey=" + MomoConfig.ACCESS_KEY
                + "&amount=" + amountStr
                + "&extraData=" + MomoConfig.EXTRA_DATA
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + MomoConfig.PARTNER_CODE
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + MomoConfig.REQUEST_TYPE;

        String signature = hmacSha256(rawSignature, MomoConfig.SECRET_KEY);

        String jsonBody = buildJsonBody(orderId, requestId, amountStr, orderInfo, redirectUrl, ipnUrl, signature);

        // POST JSON
        URL url = new URL(MomoConfig.CREATE_ENDPOINT);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);
        byte[] out = jsonBody.getBytes(StandardCharsets.UTF_8);
        conn.setFixedLengthStreamingMode(out.length);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(out);
        }

        int code = conn.getResponseCode();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
        }
        String response = sb.toString();

        String payUrl = extractPayUrl(response);
        if (payUrl == null || payUrl.isEmpty()) {
            throw new IllegalStateException("MoMo không trả payUrl: " + response);
        }
        return payUrl.replace("\\/", "/");
    }

    private static String extractPayUrl(String json) {
        String key = "\"payUrl\":\"";
        int i = json.indexOf(key);
        if (i < 0) {
            key = "\"payUrl\": \"";
            i = json.indexOf(key);
        }
        if (i < 0) return null;
        int start = i + key.length();
        StringBuilder sb = new StringBuilder();
        for (int p = start; p < json.length(); p++) {
            char c = json.charAt(p);
            if (c == '\\' && p + 1 < json.length()) {
                char n = json.charAt(p + 1);
                if (n == '/' || n == '\\') {
                    sb.append(n == '/' ? '/' : '\\');
                    p++;
                    continue;
                }
            }
            if (c == '"') break;
            sb.append(c);
        }
        return sb.toString();
    }

    private static String buildJsonBody(String orderId, String requestId, String amount,
            String orderInfo, String redirectUrl, String ipnUrl, String signature) {

        String escInfo = escapeJson(orderInfo);
        String escRedirect = escapeJson(redirectUrl);
        String escIpn = escapeJson(ipnUrl);

        return "{"
                + "\"partnerCode\":\"" + MomoConfig.PARTNER_CODE + "\","
                + "\"partnerName\":\"" + escapeJson(MomoConfig.PARTNER_NAME) + "\","
                + "\"storeId\":\"" + MomoConfig.STORE_ID + "\","
                + "\"requestId\":\"" + escapeJson(requestId) + "\","
                + "\"amount\":" + amount + ","
                + "\"orderId\":\"" + escapeJson(orderId) + "\","
                + "\"orderInfo\":\"" + escInfo + "\","
                + "\"redirectUrl\":\"" + escRedirect + "\","
                + "\"ipnUrl\":\"" + escIpn + "\","
                + "\"lang\":\"" + MomoConfig.LANG + "\","
                + "\"requestType\":\"" + MomoConfig.REQUEST_TYPE + "\","
                + "\"autoCapture\":" + MomoConfig.AUTO_CAPTURE + ","
                + "\"extraData\":\"" + MomoConfig.EXTRA_DATA + "\","
                + "\"orderGroupId\":\"" + MomoConfig.ORDER_GROUP_ID + "\","
                + "\"signature\":\"" + signature + "\""
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String hmacSha256(String data, String key) throws Exception {
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

    public static String computeIpnSignature(JsonObject body) throws Exception {
        String rawSignature =
                "accessKey=" + getAsString(body, "accessKey")
                + "&amount=" + getAsString(body, "amount")
                + "&extraData=" + getAsString(body, "extraData")
                + "&message=" + getAsString(body, "message")
                + "&orderId=" + getAsString(body, "orderId")
                + "&orderInfo=" + getAsString(body, "orderInfo")
                + "&orderType=" + getAsString(body, "orderType")
                + "&partnerCode=" + getAsString(body, "partnerCode")
                + "&payType=" + getAsString(body, "payType")
                + "&requestId=" + getAsString(body, "requestId")
                + "&responseTime=" + getAsString(body, "responseTime")
                + "&resultCode=" + getAsString(body, "resultCode")
                + "&transId=" + getAsString(body, "transId");
        return hmacSha256(rawSignature, MomoConfig.SECRET_KEY);
    }

    private static String getAsString(JsonObject body, String key) {
        return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsString() : "";
    }
}
