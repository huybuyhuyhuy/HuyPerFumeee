package data.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Gọi server Node (demo MoMo) đang chạy song song Tomcat: POST http://127.0.0.1:5000/payment
 */
public final class MomoNodeClient {

    private MomoNodeClient() {}

    public static String createPayment(long amountVnd, String orderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {

        String json = "{"
                + "\"amount\":" + amountVnd + ","
                + "\"orderId\":\"" + escape(orderId) + "\","
                + "\"orderInfo\":\"" + escape(orderInfo) + "\","
                + "\"redirectUrl\":\"" + escape(redirectUrl) + "\","
                + "\"ipnUrl\":\"" + escape(ipnUrl) + "\""
                + "}";

        URL url = new URL(MomoConfig.NODE_PAYMENT_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);
        byte[] out = json.getBytes(StandardCharsets.UTF_8);
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
            throw new IllegalStateException("Node không trả payUrl: " + response);
        }
        return payUrl.replace("\\/", "/");
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
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
}
