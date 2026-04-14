package data.driver;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import data.utils.Constants;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;
public class MySQLDriver {
    private static volatile boolean schemaInitialized = false;
    private static HikariDataSource dataSource;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(Constants.URL_DB);
            config.setUsername(Constants.USER);
            config.setPassword(Constants.PASS);
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setConnectionTimeout(10000);
            config.setIdleTimeout(300000);
            config.setMaxLifetime(1800000);
            config.setPoolName("HuyPerfumePool");
            dataSource = new HikariDataSource(config);
        } catch (Exception ex) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.SEVERE, "Cannot initialize HikariCP", ex);
        }
    }

    public static Connection getConnection(){
        if (dataSource == null) {
            return null;
        }
        try {
            Connection con = dataSource.getConnection();

            ensureSchemaInitializedOnce(con);
            
            return con;
        } catch (SQLException ex) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    private static void ensureSchemaInitializedOnce(Connection con) {
        if (schemaInitialized) {
            return;
        }
        synchronized (MySQLDriver.class) {
            if (schemaInitialized) {
                return;
            }
            checkAndAddStockColumn(con);
            checkAndAddDobColumn(con);
            checkAndAddAddressColumn(con);
            checkAndAddDiscountPriceColumn(con);
            checkAndAddOrderStatusColumn(con);
            checkAndCreateWishlistTable(con);
            schemaInitialized = true;
        }
    }

    private static void checkAndAddOrderStatusColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM orders LIKE 'status'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'Chờ xác nhận' AFTER payment_method");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'status' vào bảng 'orders'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột status cho orders", e);
        }
    }

    private static void checkAndAddDiscountPriceColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM products LIKE 'discount_price'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE products ADD COLUMN discount_price DOUBLE DEFAULT 0 AFTER price");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'discount_price' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột discount_price", e);
        }
    }

    private static void checkAndAddStockColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            // Kiểm tra xem cột stock có tồn tại trong bảng products không
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM products LIKE 'stock'");
            if (!rs.next()) {
                // Nếu không tồn tại, thêm cột stock
                stmt.executeUpdate("ALTER TABLE products ADD COLUMN stock INT DEFAULT 0 AFTER id_brand");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'stock' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột stock", e);
        }
    }

    private static void checkAndAddDobColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            // Kiểm tra xem cột dob có tồn tại trong bảng users không
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM users LIKE 'dob'");
            if (!rs.next()) {
                // Nếu không tồn tại, thêm cột dob (Date of Birth)
                stmt.executeUpdate("ALTER TABLE users ADD COLUMN dob DATE AFTER phone");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'dob' vào bảng 'users'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột dob", e);
        }
    }

    private static void checkAndAddAddressColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM users LIKE 'address'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE users ADD COLUMN address TEXT AFTER password");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'address' vào bảng 'users'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột address", e);
        }
    }

    private static void checkAndCreateWishlistTable(Connection con) {
        String sql = "CREATE TABLE IF NOT EXISTS wishlist ("
                + "id INT AUTO_INCREMENT PRIMARY KEY,"
                + "user_id INT NOT NULL,"
                + "product_id INT NOT NULL,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "UNIQUE KEY uq_wishlist_user_product (user_id, product_id),"
                + "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,"
                + "FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE"
                + ")";
        try (java.sql.Statement stmt = con.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi tạo bảng wishlist", e);
        }
    }
    
}
