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
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
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
            checkAndAddProductAdvancedColumns(con);
            checkAndAddOrderPaymentColumns(con);
            checkAndAddOrderShippingColumns(con);
            checkAndAddOrderItemSnapshotColumns(con);
            checkAndAddOrderItemStatusColumn(con);
            checkAndAddProductVolumeColumn(con);
            fillMissingScentNotes(con);
            checkAndCreateWishlistTable(con);
            schemaInitialized = true;
        }
    }

    private static void checkAndAddOrderStatusColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE orders ADD status NVARCHAR(50) DEFAULT 'Chờ xác nhận'");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'status' vào bảng 'orders'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột status cho orders", e);
        }
    }

    private static void checkAndAddDiscountPriceColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'discount_price'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE products ADD discount_price FLOAT DEFAULT 0");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'discount_price' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột discount_price", e);
        }
    }

    private static void checkAndAddStockColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'stock'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE products ADD stock INT DEFAULT 0");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'stock' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột stock", e);
        }
    }

    private static void checkAndAddDobColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'dob'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE users ADD dob DATE");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'dob' vào bảng 'users'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột dob", e);
        }
    }

    private static void checkAndAddAddressColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'address'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE users ADD address NVARCHAR(MAX)");
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột 'address' vào bảng 'users'.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi kiểm tra/thêm cột address", e);
        }
    }

    private static void checkAndCreateWishlistTable(Connection con) {
        String sql = "IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wishlist' AND xtype='U') "
                + "CREATE TABLE wishlist ("
                + "id INT IDENTITY(1,1) PRIMARY KEY,"
                + "user_id INT NOT NULL,"
                + "product_id INT NOT NULL,"
                + "created_at DATETIME2 DEFAULT GETDATE(),"
                + "CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id),"
                + "FOREIGN KEY (user_id) REFERENCES users(id),"
                + "FOREIGN KEY (product_id) REFERENCES products(id)"
                + ")";
        try (java.sql.Statement stmt = con.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi tạo bảng wishlist", e);
        }
    }

    private static void checkAndAddProductAdvancedColumns(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "products", "sku", "ALTER TABLE products ADD sku NVARCHAR(100)");
            ensureColumn(stmt, "products", "batch_code", "ALTER TABLE products ADD batch_code NVARCHAR(100)");
            ensureColumn(stmt, "products", "scent_notes", "ALTER TABLE products ADD scent_notes NVARCHAR(MAX)");
            ensureColumn(stmt, "products", "is_decant", "ALTER TABLE products ADD is_decant BIT DEFAULT 0");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột mở rộng products", e);
        }
    }

    private static void checkAndAddOrderPaymentColumns(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "orders", "momo_order_id", "ALTER TABLE orders ADD momo_order_id NVARCHAR(120)");
            ensureColumn(stmt, "orders", "momo_trans_id", "ALTER TABLE orders ADD momo_trans_id NVARCHAR(120)");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột thanh toán orders", e);
        }
    }

    private static void checkAndAddOrderShippingColumns(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "orders", "shipping_address", "ALTER TABLE orders ADD shipping_address NVARCHAR(MAX)");
            ensureColumn(stmt, "orders", "phone", "ALTER TABLE orders ADD phone NVARCHAR(20)");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột giao hàng orders", e);
        }
    }

    private static void checkAndAddOrderItemSnapshotColumns(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "order_items", "selected_batch_code", "ALTER TABLE order_items ADD selected_batch_code NVARCHAR(100)");
            ensureColumn(stmt, "order_items", "price_at_purchase", "ALTER TABLE order_items ADD price_at_purchase FLOAT");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột snapshot order_items", e);
        }
    }

    private static void checkAndAddOrderItemStatusColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "order_items", "status", "ALTER TABLE order_items ADD status NVARCHAR(50) DEFAULT 'Normal'");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột status cho order_items", e);
        }
    }

    private static void fillMissingScentNotes(Connection con) {
        String sql = "UPDATE products SET scent_notes = CASE id % 4 "
                + "WHEN 0 THEN 'Cam Bergamot, Quyt xanh, Tieu hong|Hoa oai huong, Hoa phong lu, Nhu huong|Go tuyet tung, Xa huong trang, Ho phach' "
                + "WHEN 1 THEN 'Chanh vang, Tao xanh, Bach dau khau|Hoa hong, Nhan trang, Hoa cam|Go dan huong, Vanilla, Vetiver' "
                + "WHEN 2 THEN 'Buoi chum, Qua le, La tim|Hoa mau don, Lily, Hoa sua|Patchouli, Amber, Xa huong' "
                + "ELSE 'Bach qua, Tieu den, Mandarin|Iris, Geranium, Hoa linh lan|Tonka bean, Oud nhe, Go guaiac' END "
                + "WHERE scent_notes IS NULL OR TRIM(scent_notes) = ''";
        try (java.sql.Statement stmt = con.createStatement()) {
            int affected = stmt.executeUpdate(sql);
            if (affected > 0) {
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã cập nhật scent_notes mặc định cho " + affected + " sản phẩm.");
            }
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi cập nhật scent_notes mặc định", e);
        }
    }

    private static void checkAndAddProductVolumeColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            ensureColumn(stmt, "products", "volume_ml", "ALTER TABLE products ADD volume_ml INT DEFAULT 0");
        } catch (SQLException e) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.WARNING, "Lỗi khi thêm cột volume_ml cho products", e);
        }
    }

    private static void ensureColumn(java.sql.Statement stmt, String table, String column, String ddl) throws SQLException {
        try (java.sql.ResultSet rs = stmt.executeQuery("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + table + "' AND COLUMN_NAME = '" + column + "'")) {
            if (!rs.next()) {
                stmt.executeUpdate(ddl);
                Logger.getLogger(MySQLDriver.class.getName()).info("Đã tự động thêm cột '" + column + "' vào bảng '" + table + "'.");
            }
        }
    }
    
}
