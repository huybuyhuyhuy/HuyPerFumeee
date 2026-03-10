package controller;

import data.dao.Database;
import data.driver.MySQLDriver;
import model.Products;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AdminHomeServlet", urlPatterns = {"/admin"})
public class AdminHomeServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Lấy tham số lọc từ URL
        String catIdRaw = request.getParameter("categoryId");
        String brandIdRaw = request.getParameter("brandId");
        
        List<Products> list;

        // 2. Logic lọc sản phẩm đồng bộ
        if (catIdRaw != null && !catIdRaw.isEmpty()) {
            int catId = Integer.parseInt(catIdRaw);
            list = Database.getProductsDao().getProductsByCategoryId(catId);
        } else if (brandIdRaw != null && !brandIdRaw.isEmpty()) {
            int brandId = Integer.parseInt(brandIdRaw);
            // Ép kiểu để gọi hàm lấy theo Brand ID đơn lẻ
            list = ((data.impl.ProductsImpl)Database.getProductsDao()).getProductsByBrandId(brandId);
        } else {
            list = Database.getProductsDao().findAll();
        }

        // 3. Đưa tất cả dữ liệu cần thiết sang JSP
        request.setAttribute("listCategories", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("listProducts", list);
        request.setAttribute("title", "Quản lý sản phẩm");

        // 4. Thống kê bán hàng (dựa trên bảng orders & order_items)
        // Lưu ý: bạn cần có 2 bảng:
        //  - orders(id, user_id, created_at, total, ...)
        //  - order_items(id, order_id, product_id, quantity, price, ...)
        // và CheckoutServlet phải insert dữ liệu vào đó thì thống kê mới có ý nghĩa.

        request.setAttribute("salesByDay",   getSalesByDay(7));   // 7 ngày gần nhất
        request.setAttribute("salesByWeek",  getSalesByWeek(4));  // 4 tuần gần nhất
        request.setAttribute("salesByMonth", getSalesByMonth(6)); // 6 tháng gần nhất
        request.setAttribute("salesByYear", getSalesByYear(5)); // 5 năm gần nhất

        // 5. Thống kê: hôm nay có bao nhiêu user đã đặt hàng
        request.setAttribute("todayUserOrderCount", getTodayUserOrderCount());

        request.getRequestDispatcher("/inc/_admin.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }

    // ================== HÀM THỐNG KÊ BÁN HÀNG ==================

    // Theo ngày: trả về Map<label, quantity> với label kiểu dd/MM
    private Map<String, Integer> getSalesByDay(int daysBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = """
            SELECT DATE(o.created_at) AS d, SUM(oi.quantity) AS total_qty
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(o.created_at)
            ORDER BY d
        """;
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, daysBack);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    LocalDate d = rs.getDate("d").toLocalDate();
                    String label = d.getDayOfMonth() + "/" + d.getMonthValue();
                    result.put(label, rs.getInt("total_qty"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    // Theo tuần: sử dụng YEARWEEK, label dạng "Tuần xx"
    private Map<String, Integer> getSalesByWeek(int weeksBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = """
            SELECT YEARWEEK(o.created_at, 1) AS yw, SUM(oi.quantity) AS total_qty
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
            GROUP BY YEARWEEK(o.created_at, 1)
            ORDER BY yw
        """;
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, weeksBack);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int yw = rs.getInt("yw"); // vd: 202407
                    int week = yw % 100;
                    String label = "Tuần " + week;
                    result.put(label, rs.getInt("total_qty"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    // Theo tháng: label dạng MM/YYYY
    private Map<String, Integer> getSalesByMonth(int monthsBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = """
            SELECT DATE_FORMAT(o.created_at, '%m/%Y') AS m, SUM(oi.quantity) AS total_qty
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(o.created_at, '%m/%Y')
            ORDER BY MIN(o.created_at)
        """;
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, monthsBack);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String label = rs.getString("m");
                    result.put(label, rs.getInt("total_qty"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    // Theo năm: label là năm (yyyy)
    private Map<String, Integer> getSalesByYear(int yearsBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = """
            SELECT YEAR(o.created_at) AS y, SUM(oi.quantity) AS total_qty
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? YEAR)
            GROUP BY YEAR(o.created_at)
            ORDER BY y
        """;
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, yearsBack);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String label = String.valueOf(rs.getInt("y"));
                    result.put(label, rs.getInt("total_qty"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    // Số user khác nhau đã đặt hàng trong ngày hôm nay
    private int getTodayUserOrderCount() {
        String sql = """
            SELECT COUNT(DISTINCT user_id) AS c
            FROM orders
            WHERE DATE(created_at) = CURDATE()
              AND user_id IS NOT NULL
              AND user_id <> 0
        """;
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt("c");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
    // ==========================================================
}
