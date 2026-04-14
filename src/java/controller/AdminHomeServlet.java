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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet(name = "AdminHomeServlet", urlPatterns = {"/admin"})
public class AdminHomeServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Lấy tham số điều hướng (Statistics vs Products)
        String type = request.getParameter("type");
        if (type == null) type = "statistics"; // Mặc định là Thống kê
        
        // 2. Lấy tham số lọc từ URL (nếu ở chế độ sản phẩm)
        String catIdRaw = request.getParameter("categoryId");
        String brandIdRaw = request.getParameter("brandId");
        
        List<Products> list;
        List<Map<String, Object>> ordersList = new ArrayList<>();

        // 3. Logic điều hướng dữ liệu
        if ("products".equals(type)) {
            if (catIdRaw != null && !catIdRaw.isEmpty()) {
                int catId = Integer.parseInt(catIdRaw);
                list = Database.getProductsDao().getProductsByCategoryId(catId);
            } else if (brandIdRaw != null && !brandIdRaw.isEmpty()) {
                int brandId = Integer.parseInt(brandIdRaw);
                list = Database.getProductsDao().getProductsByBrandId(brandId);
            } else {
                list = Database.getProductsDao().findAll();
            }
            request.setAttribute("listProducts", list);
        } else if ("orders".equals(type)) {
            int pageSize = 10;
            int currentPage = 1;
            String pageRaw = request.getParameter("page");
            if (pageRaw != null && !pageRaw.isEmpty()) {
                try {
                    currentPage = Integer.parseInt(pageRaw);
                } catch (NumberFormatException e) {
                    currentPage = 1;
                }
            }
            if (currentPage < 1) {
                currentPage = 1;
            }
            int totalOrders = getTotalOrdersCount();
            int totalPages = (int) Math.ceil((double) totalOrders / pageSize);
            if (totalPages > 0 && currentPage > totalPages) {
                currentPage = totalPages;
            }

            ordersList = getOrdersByPage(currentPage, pageSize);
            request.setAttribute("listOrders", ordersList);
            request.setAttribute("currentOrderPage", currentPage);
            request.setAttribute("totalOrderPages", totalPages);
        }

        // 4. Đưa tất cả dữ liệu chung sang JSP
        request.setAttribute("listCategories", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("title", "statistics".equals(type) ? "Thống kê hệ thống" : ("orders".equals(type) ? "Quản lý đơn hàng" : "Quản lý sản phẩm"));
        request.setAttribute("viewType", type);

        // 5. Thống kê dashboard (luôn tính toán để hiển thị ở bất kỳ trang nào nếu cần)
        request.setAttribute("totalRevenue", getTotalRevenue());
        request.setAttribute("totalOrders", getTotalOrders());
        request.setAttribute("totalUsers", getTotalUsers());
        request.setAttribute("orderStatusMap", getOrderStatusDistribution());
        request.setAttribute("topSellingProducts", getTopSellingProducts(5));
        request.getSession().setAttribute("adminCsrfToken", UUID.randomUUID().toString());

        request.getRequestDispatcher("/inc/_admin.jsp").forward(request, response);
    }

    private List<Map<String, Object>> getOrdersByPage(int page, int pageSize) {
        List<Map<String, Object>> orders = new ArrayList<>();
        String sql = "SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.id DESC LIMIT ? OFFSET ?";
        
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, pageSize);
            ps.setInt(2, (page - 1) * pageSize);
            try (ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> order = new LinkedHashMap<>();
                order.put("id", rs.getInt("id"));
                order.put("user_name", rs.getString("user_name") != null ? rs.getString("user_name") : "Khách vãng lai");
                order.put("total", rs.getDouble("total"));
                order.put("payment_method", rs.getString("payment_method"));
                order.put("status", rs.getString("status"));
                order.put("created_at", rs.getTimestamp("created_at"));
                orders.add(order);
            }
            }
        } catch (SQLException e) {
            getServletContext().log("Error loading paged orders", e);
        }
        return orders;
    }

    private int getTotalOrdersCount() {
        String sql = "SELECT COUNT(*) FROM orders";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException e) {
            getServletContext().log("Error counting orders", e);
        }
        return 0;
    }

    private double getTotalRevenue() {
        // Lấy tổng tất cả đơn hàng, không quan tâm trạng thái (vì có thể trạng thái đang để trống)
        String sql = "SELECT SUM(total) FROM orders";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getDouble(1);
        } catch (SQLException e) { getServletContext().log("Error computing total revenue", e); }
        return 0;
    }

    private int getTotalOrders() {
        String sql = "SELECT COUNT(*) FROM orders";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) { getServletContext().log("Error computing total orders", e); }
        return 0;
    }

    private int getTotalUsers() {
        // Đếm tất cả người dùng, bỏ qua điều kiện role nếu nó đang bị sai
        String sql = "SELECT COUNT(*) FROM users";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) { getServletContext().log("Error computing total users", e); }
        return 0;
    }

    private Map<String, Integer> getOrderStatusDistribution() {
        Map<String, Integer> result = new LinkedHashMap<>();
        // Danh sách các trạng thái theo đúng yêu cầu hình ảnh
        String[] statuses = {
            "Giao hàng thành công", 
            "Chờ xác nhận", 
            "Đang giao", 
            "Đã xác nhận", 
            "Đã hủy", 
            "Đã hoàn tiền", 
            "Đang hoàn tiền"
        };
        
        // Khởi tạo tất cả bằng 0
        for (String s : statuses) result.put(s, 0);

        String sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String dbStatus = rs.getString("status");
                if (dbStatus != null && result.containsKey(dbStatus)) {
                    result.put(dbStatus, rs.getInt("count"));
                } else if (dbStatus == null || dbStatus.isEmpty()) {
                    // Nếu status trống, mặc định cho vào "Chờ xác nhận"
                    result.put("Chờ xác nhận", result.get("Chờ xác nhận") + rs.getInt("count"));
                }
            }
        } catch (SQLException e) { getServletContext().log("Error computing order status distribution", e); }
        
        return result;
    }

    private List<Products> getTopSellingProducts(int limit) {
        // Mocking top products based on sales quantity
        // In real app, you would join with order_items
        return Database.getProductsDao().findAll().subList(0, Math.min(limit, 5));
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
        String sql = "SELECT DATE(o.created_at) AS d, SUM(oi.quantity) AS total_qty " +
                     "FROM orders o " +
                     "JOIN order_items oi ON o.id = oi.order_id " +
                     "WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) " +
                     "GROUP BY DATE(o.created_at) " +
                     "ORDER BY d";
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
            getServletContext().log("Error computing sales by day", e);
        }
        return result;
    }

    // Theo tuần: sử dụng YEARWEEK, label dạng "Tuần xx"
    private Map<String, Integer> getSalesByWeek(int weeksBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT YEARWEEK(o.created_at, 1) AS yw, SUM(oi.quantity) AS total_qty " +
                     "FROM orders o " +
                     "JOIN order_items oi ON o.id = oi.order_id " +
                     "WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? WEEK) " +
                     "GROUP BY YEARWEEK(o.created_at, 1) " +
                     "ORDER BY yw";
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
            getServletContext().log("Error computing sales by week", e);
        }
        return result;
    }

    // Theo tháng: label dạng MM/YYYY
    private Map<String, Integer> getSalesByMonth(int monthsBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT DATE_FORMAT(o.created_at, '%m/%Y') AS m, SUM(oi.quantity) AS total_qty " +
                     "FROM orders o " +
                     "JOIN order_items oi ON o.id = oi.order_id " +
                     "WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) " +
                     "GROUP BY DATE_FORMAT(o.created_at, '%m/%Y') " +
                     "ORDER BY MIN(o.created_at)";
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
            getServletContext().log("Error computing sales by month", e);
        }
        return result;
    }

    // Theo năm: label là năm (yyyy)
    private Map<String, Integer> getSalesByYear(int yearsBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT YEAR(o.created_at) AS y, SUM(oi.quantity) AS total_qty " +
                     "FROM orders o " +
                     "JOIN order_items oi ON o.id = oi.order_id " +
                     "WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? YEAR) " +
                     "GROUP BY YEAR(o.created_at) " +
                     "ORDER BY y";
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
            getServletContext().log("Error computing sales by year", e);
        }
        return result;
    }

    // Số user khác nhau đã đặt hàng trong ngày hôm nay
    private int getTodayUserOrderCount() {
        String sql = "SELECT COUNT(DISTINCT user_id) AS c " +
                     "FROM orders " +
                     "WHERE DATE(created_at) = CURDATE() " +
                     "AND user_id IS NOT NULL " +
                     "AND user_id <> 0";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt("c");
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing today's user order count", e);
        }
        return 0;
    }
    // ==========================================================
}
