package data.utils;

public class Constants {
    public static final String URL_DB = "jdbc:mysql://localhost:3306/huyperfume?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&useUnicode=true&characterEncoding=UTF-8&connectionCollation=utf8mb4_unicode_ci";
    public static final String USER = "root";
    public static final String PASS = System.getenv("MYSQL_PASSWORD") != null
            ? System.getenv("MYSQL_PASSWORD")
            : "";
}
