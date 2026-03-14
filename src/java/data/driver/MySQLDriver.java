/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package data.driver;
import data.utils.Constants;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;
/**
 *
 * @author huyle
 */
public class MySQLDriver {
    public static Connection getConnection(){
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(Constants.URL_DB,Constants.USER,Constants.PASS);
            
            // Tự động kiểm tra và thêm cột stock nếu thiếu
            checkAndAddStockColumn(con);
            
            // Tự động kiểm tra và thêm cột dob nếu thiếu cho bảng users
            checkAndAddDobColumn(con);
            
            // Tự động kiểm tra và thêm cột discount_price nếu thiếu cho bảng products
            checkAndAddDiscountPriceColumn(con);

            // Tự động kiểm tra và thêm cột status nếu thiếu cho bảng orders
            checkAndAddOrderStatusColumn(con);
            
            return con;
        } catch (ClassNotFoundException | SQLException ex) {
            Logger.getLogger(MySQLDriver.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    private static void checkAndAddOrderStatusColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM orders LIKE 'status'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'Chờ xác nhận' AFTER payment_method");
                System.out.println("Đã tự động thêm cột 'status' vào bảng 'orders'.");
            }
        } catch (SQLException e) {
            System.err.println("Lỗi khi kiểm tra/thêm cột status cho orders: " + e.getMessage());
        }
    }

    private static void checkAndAddDiscountPriceColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM products LIKE 'discount_price'");
            if (!rs.next()) {
                stmt.executeUpdate("ALTER TABLE products ADD COLUMN discount_price DOUBLE DEFAULT 0 AFTER price");
                System.out.println("Đã tự động thêm cột 'discount_price' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            System.err.println("Lỗi khi kiểm tra/thêm cột discount_price: " + e.getMessage());
        }
    }

    private static void checkAndAddStockColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            // Kiểm tra xem cột stock có tồn tại trong bảng products không
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM products LIKE 'stock'");
            if (!rs.next()) {
                // Nếu không tồn tại, thêm cột stock
                stmt.executeUpdate("ALTER TABLE products ADD COLUMN stock INT DEFAULT 0 AFTER id_brand");
                System.out.println("Đã tự động thêm cột 'stock' vào bảng 'products'.");
            }
        } catch (SQLException e) {
            // Có thể bảng products chưa được tạo, bỏ qua lỗi này
            System.err.println("Lỗi khi kiểm tra/thêm cột stock: " + e.getMessage());
        }
    }

    private static void checkAndAddDobColumn(Connection con) {
        try (java.sql.Statement stmt = con.createStatement()) {
            // Kiểm tra xem cột dob có tồn tại trong bảng users không
            java.sql.ResultSet rs = stmt.executeQuery("SHOW COLUMNS FROM users LIKE 'dob'");
            if (!rs.next()) {
                // Nếu không tồn tại, thêm cột dob (Date of Birth)
                stmt.executeUpdate("ALTER TABLE users ADD COLUMN dob DATE AFTER phone");
                System.out.println("Đã tự động thêm cột 'dob' vào bảng 'users'.");
            }
        } catch (SQLException e) {
            System.err.println("Lỗi khi kiểm tra/thêm cột dob: " + e.getMessage());
        }
    }
    
}
