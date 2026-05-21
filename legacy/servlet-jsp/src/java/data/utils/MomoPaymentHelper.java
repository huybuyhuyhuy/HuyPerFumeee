package data.utils;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class MomoPaymentHelper {

    private MomoPaymentHelper() {
    }

    public static String createPayment(long amountVnd, String orderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {

        String requestId = orderId;
        String amount = String.valueOf(amountVnd);
        String rawSignature = "accessKey=" + MomoConfig.ACCESS_KEY
                + "&amount=" + amount
                + "&extraData=" + MomoConfig.EXTRA_DATA
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + MomoConfig.PARTNER_CODE
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + MomoConfig.REQUEST_TYPE;

        String signature = hmacSha256(rawSignature, MomoConfig.SECRET_KEY);
        JsonObject payload = new JsonObject();
        payload.addProperty("partnerCode", MomoConfig.PARTNER_CODE);
        payload.addProperty("partnerName", MomoConfig.PARTNER_NAME);
        payload.addProperty("storeId", MomoConfig.STORE_ID);
        payload.addProperty("requestId", requestId);
        payload.addProperty("amount", amountVnd);
        payload.addProperty("orderId", orderId);
        payload.addProperty("orderInfo", orderInfo);
        payload.addProperty("redirectUrl", redirectUrl);
        payload.addProperty("ipnUrl", ipnUrl);
        payload.addProperty("lang", MomoConfig.LANG);
        payload.addProperty("requestType", MomoConfig.REQUEST_TYPE);
        payload.addProperty("autoCapture", MomoConfig.AUTO_CAPTURE);
        payload.addProperty("extraData", MomoConfig.EXTRA_DATA);
        payload.addProperty("orderGroupId", MomoConfig.ORDER_GROUP_ID);
        payload.addProperty("signature", signature);

        JsonObject result = postJson(MomoConfig.CREATE_ENDPOINT, payload.toString());
        String payUrl = getAsString(result, "payUrl");
        if (payUrl == null || payUrl.isBlank()) {
            throw new IllegalStateException("MoMo did not return payUrl: " + result);
        }
        return payUrl.replace("\\/", "/");
    }

    public static String computeIpnSignature(JsonObject body) throws Exception {
        String rawSignature = "accessKey=" + getAsString(body, "accessKey")
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

    private static JsonObject postJson(String endpoint, String jsonBody) throws Exception {
        URL url = new URL(endpoint);
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
        String response;
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            response = sb.toString();
        }

        JsonObject result = JsonParser.parseString(response).getAsJsonObject();
        if (code >= 400) {
            throw new IllegalStateException("MoMo HTTP " + code + ": " + result);
        }
        return result;
    }

    private static String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) {
                hex.append('0');
            }
            hex.append(h);
        }
        return hex.toString();
    }

    private static String getAsString(JsonObject body, String key) {
        return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsString() : "";
    }
}
