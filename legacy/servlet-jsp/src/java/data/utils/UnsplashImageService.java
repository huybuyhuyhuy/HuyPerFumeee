package data.utils;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Gọi Unsplash Search API để lấy ảnh banner và nội dung.
 * Tự động cache và rate-limit để không vượt 50 req/giờ.
 */
public final class UnsplashImageService {

    private static final Gson GSON = new Gson();

    private static final ConcurrentHashMap<String, CachedImage> CACHE = new ConcurrentHashMap<>();
    private static final AtomicInteger REQUEST_COUNT = new AtomicInteger(0);
    private static final AtomicLong WINDOW_START = new AtomicLong(System.currentTimeMillis());

    private UnsplashImageService() {}

    /**
     * Tìm ảnh Unsplash cho một query bất kỳ.
     * @return URL ảnh regular size, hoặc null nếu không tìm thấy / rate-limited
     */
    public static String getImage(String query) {
        if (query == null || query.isBlank()) return null;

        String cacheKey = query.toLowerCase().replaceAll("[^a-z0-9 ]", "").replaceAll("\\s+", "_");
        CachedImage cached = CACHE.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.url;
        }

        if (isRateLimited()) {
            if (cached != null) return cached.url;
            return null;
        }

        String imageUrl = callUnsplashApi(query);

        if (imageUrl == null && cached != null) {
            imageUrl = cached.url;
        }

        CACHE.put(cacheKey, new CachedImage(imageUrl));
        return imageUrl;
    }

    private static boolean isRateLimited() {
        long now = System.currentTimeMillis();
        long window = WINDOW_START.get();
        if (now - window > 3600_000L) {
            WINDOW_START.set(now);
            REQUEST_COUNT.set(0);
            return false;
        }
        return REQUEST_COUNT.get() >= UnsplashConfig.MAX_REQUESTS_PER_HOUR;
    }

    private static String callUnsplashApi(String query) {
        if (UnsplashConfig.ACCESS_KEY.isEmpty()) {
            System.err.println("[Unsplash] UNSPLASH_ACCESS_KEY chưa được set. Bỏ qua.");
            return null;
        }

        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            URL url = new URL(UnsplashConfig.SEARCH_ENDPOINT
                    + "?query=" + encoded
                    + "&per_page=1"
                    + "&orientation=squarish"
                    + "&content_filter=high");

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Client-ID " + UnsplashConfig.ACCESS_KEY);
            conn.setRequestProperty("Accept-Version", "v1");
            conn.setConnectTimeout(UnsplashConfig.CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(UnsplashConfig.READ_TIMEOUT_MS);

            REQUEST_COUNT.incrementAndGet();

            int code = conn.getResponseCode();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(
                    code >= 400 ? conn.getErrorStream() : conn.getInputStream(),
                    StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
            }

            if (code != 200) {
                System.err.println("[Unsplash] API error " + code + ": " + sb);
                return null;
            }

            JsonObject json = GSON.fromJson(sb.toString(), JsonObject.class);
            JsonArray results = json.getAsJsonArray("results");
            if (results == null || results.size() == 0) {
                return null;
            }

            JsonObject first = results.get(0).getAsJsonObject();
            JsonObject urls = first.getAsJsonObject("urls");
            if (urls != null && urls.has("regular")) {
                return urls.get("regular").getAsString();
            }

        } catch (Exception e) {
            System.err.println("[Unsplash] Exception: " + e.getMessage());
        }

        return null;
    }

    // ── Public helpers ──

    public static int getCacheSize() {
        return CACHE.size();
    }

    public static int getRemainingRequests() {
        long now = System.currentTimeMillis();
        if (now - WINDOW_START.get() > 3600_000L) {
            return UnsplashConfig.MAX_REQUESTS_PER_HOUR;
        }
        return Math.max(0, UnsplashConfig.MAX_REQUESTS_PER_HOUR - REQUEST_COUNT.get());
    }

    public static void clearCache() {
        CACHE.clear();
    }

    // ── Inner class ──

    private static class CachedImage {
        final String url;
        final long cachedAt;

        CachedImage(String url) {
            this.url = url;
            this.cachedAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - cachedAt > UnsplashConfig.CACHE_TTL_MS;
        }
    }
}
