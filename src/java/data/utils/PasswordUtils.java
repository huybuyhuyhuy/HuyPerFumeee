package data.utils;

import org.mindrot.jbcrypt.BCrypt;

public final class PasswordUtils {

    private PasswordUtils() {
    }

    public static String hash(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(12));
    }

    public static boolean verify(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null || storedHash.isBlank()) {
            return false;
        }
        if (isBcryptHash(storedHash)) {
            return BCrypt.checkpw(plainPassword, storedHash);
        }
        // Backward compatibility for old MD5 records.
        return API.getMd5(plainPassword).equalsIgnoreCase(storedHash);
    }

    public static boolean isBcryptHash(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }
}
