package data.utils;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.logging.Logger;

public final class MomoNodeClient {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private MomoNodeClient() {
    }

    public static String createPayment(long amountVnd, String orderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {
        JsonObject payload = new JsonObject();
        payload.addProperty("amount", amountVnd);
        payload.addProperty("orderId", orderId);
        payload.addProperty("orderInfo", orderInfo);
        payload.addProperty("redirectUrl", redirectUrl);
        payload.addProperty("ipnUrl", ipnUrl);

        JsonObject response = postJson(MomoConfig.NODE_PAYMENT_URL, payload.toString());
        String payUrl = getAsString(response, "payUrl");
        if (payUrl == null || payUrl.isBlank()) {
            throw new IllegalStateException("Node proxy did not return payUrl: " + response);
        }
        return payUrl.replace("\\/", "/");
    }

    public static void refundPayment(String orderId, String transId, long amount, String description) throws Exception {
        JsonObject payload = new JsonObject();
        payload.addProperty("orderId", orderId);
        payload.addProperty("transId", transId);
        payload.addProperty("amount", amount);
        payload.addProperty("description", description);

        JsonObject response = postJson(MomoConfig.NODE_REFUND_URL, payload.toString());
        int resultCode = response.has("resultCode") ? response.get("resultCode").getAsInt() : 0;
        if (resultCode != 0) {
            throw new IllegalStateException("MoMo proxy refund failed: " + response);
        }
        Logger.getLogger(MomoNodeClient.class.getName()).info("MoMo refund sent: " + orderId);
    }

    private static JsonObject postJson(String endpoint, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();
        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("MoMo proxy HTTP " + response.statusCode() + ": " + json);
        }
        return json;
    }

    private static String getAsString(JsonObject body, String key) {
        return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsString() : "";
    }
}
