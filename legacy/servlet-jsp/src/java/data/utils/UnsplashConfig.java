package data.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Cấu hình Unsplash API.
 * Lấy Access Key miễn phí tại https://unsplash.com/developers
 *
 * Thứ tự ưu tiên:
 * 1. Biến môi trường UNSPLASH_ACCESS_KEY
 * 2. System property -Dunsplash.access.key=...
 * 3. File .unsplash-key trong thư mục gốc project
 */
public final class UnsplashConfig {

    private UnsplashConfig() {}

    public static final String ACCESS_KEY = loadAccessKey();

    private static String loadAccessKey() {
        String key = System.getenv("UNSPLASH_ACCESS_KEY");
        if (key != null && !key.trim().isEmpty()) {
            System.out.println("[Unsplash] Using Access Key from environment variable");
            return key.trim();
        }

        key = System.getProperty("unsplash.access.key");
        if (key != null && !key.trim().isEmpty()) {
            System.out.println("[Unsplash] Using Access Key from system property");
            return key.trim();
        }

        try {
            Path keyFile = Paths.get(".unsplash-key");
            if (Files.exists(keyFile)) {
                key = Files.readString(keyFile).trim();
                if (!key.isEmpty()) {
                    System.out.println("[Unsplash] Using Access Key from .unsplash-key file");
                    return key;
                }
            }
        } catch (IOException ignored) {}

        System.err.println("[Unsplash] WARNING: No Access Key found! Set UNSPLASH_ACCESS_KEY env variable,");
        System.err.println("[Unsplash]          or -Dunsplash.access.key=YOUR_KEY, or create .unsplash-key file.");
        return "";
    }

    public static final String SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";
    public static final int MAX_REQUESTS_PER_HOUR = 45;
    public static final long CACHE_TTL_MS = 24 * 60 * 60 * 1000L;
    public static final int CONNECT_TIMEOUT_MS = 5000;
    public static final int READ_TIMEOUT_MS = 10000;
}
