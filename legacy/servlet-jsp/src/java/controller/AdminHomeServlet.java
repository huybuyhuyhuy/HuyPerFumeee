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

        try {
            // 1. Lấy tham số điều hướng (Statistics vs Products)
            String type = request.getParameter("type");
            if (type == null) {
                type = "statistics"; // Mặc định là Thống kê
            }
            // 2. Lấy tham số lọc từ URL (nếu ở chế độ sản phẩm)
            String catIdRaw = request.getParameter("categoryId");
            String brandIdRaw = request.getParameter("brandId");
            String decantType = request.getParameter("decantType");

            List<Products> list;
            List<Map<String, Object>> ordersList = new ArrayList<>();

            // 3. Logic điều hướng dữ liệu
            if ("products".equals(type)) {
                list = Database.getProductsDao().findAll();
                list = filterProducts(list, catIdRaw, brandIdRaw, decantType);
                request.setAttribute("listProducts", list);
                request.setAttribute("selectedDecantType", decantType);
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
            List<model.Category> categories = Database.getCategoryDao().findAll();
            List<model.Brand> brands = Database.getBrandDao().getAllBrands();

            request.setAttribute("listCategories", categories != null ? categories : new ArrayList<>());
            request.setAttribute("listBrands", brands != null ? brands : new ArrayList<>());
            request.setAttribute("title", "statistics".equals(type) ? "Thống kê hệ thống" : ("orders".equals(type) ? "Quản lý đơn hàng" : "Quản lý sản phẩm"));
            request.setAttribute("viewType", type);

            // 5. Thống kê dashboard
            request.setAttribute("totalRevenue", getTotalRevenue());
            request.setAttribute("totalOrders", getTotalOrders());
            request.setAttribute("totalUsers", getTotalUsers());
            request.setAttribute("orderStatusMap", getOrderStatusDistribution());
            request.setAttribute("topSellingProducts", getTopSellingProducts(5));
            request.setAttribute("supplyDemandData", getSupplyDemandData(10));
            request.getSession().setAttribute("adminCsrfToken", UUID.randomUUID().toString());

        } catch (Exception e) {
            getServletContext().log("Admin dashboard error", e);
            String msg = e.getMessage();
            if (e.getCause() != null) {
                msg += " | Cause: " + e.getCause().getMessage();
            }
            request.setAttribute("adminError", "Đã có lỗi xảy ra khi tải dữ liệu quản trị: " + msg);
            e.printStackTrace();
        }

        request.getRequestDispatcher("/inc/_admin.jsp").forward(request, response);
    }

    private List<Products> filterProducts(List<Products> source, String catIdRaw, String brandIdRaw, String decantType) {
        List<Products> result = new ArrayList<>();
        int categoryId = parseInt(catIdRaw, -1);
        int brandId = parseInt(brandIdRaw, -1);
        boolean filterDecant = "decant".equalsIgnoreCase(decantType);
        boolean filterFullbox = "fullbox".equalsIgnoreCase(decantType);

        for (Products p : source) {
            if (categoryId > 0 && p.getId_category() != categoryId) {
                continue;
            }
            if (brandId > 0 && p.getId_brand() != brandId) {
                continue;
            }
            if (filterDecant && !p.isIs_decant()) {
                continue;
            }
            if (filterFullbox && p.isIs_decant()) {
                continue;
            }
            result.add(p);
        }
        return result;
    }

    private int parseInt(String raw, int fallback) {
        if (raw == null || raw.isEmpty()) {
            return fallback;
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private List<Map<String, Object>> getOrdersByPage(int page, int pageSize) {
        List<Map<String, Object>> orders = new ArrayList<>();
        String sql = "SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";

        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return orders;
            }
            try (PreparedStatement ps = con.prepareStatement(sql)) {
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
            }
        } catch (SQLException e) {
            getServletContext().log("Error loading paged orders", e);
        }
        return orders;
    }

    private int getTotalOrdersCount() {
        String sql = "SELECT COUNT(*) FROM orders";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return 0;
            }
            try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error counting orders", e);
        }
        return 0;
    }

    private double getTotalRevenue() {
        String sql = "SELECT SUM(total) FROM orders WHERE status IN ('Paid', 'Giao hàng thành công', 'Đã xác nhận', 'Đang giao')";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return 0;
            }
            try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getDouble(1);
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing total revenue", e);
        }
        return 0;
    }

    private int getTotalOrders() {
        String sql = "SELECT COUNT(*) FROM orders WHERE status != 'Đã hủy' AND status != 'Cancelled'";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return 0;
            }
            try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing total orders", e);
        }
        return 0;
    }

    private int getTotalUsers() {
        String sql = "SELECT COUNT(*) FROM users";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return 0;
            }
            try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing total users", e);
        }
        return 0;
    }

    private Map<String, Integer> getOrderStatusDistribution() {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                return result;
            }
            try (PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String dbStatus = rs.getString("status");
                    int count = rs.getInt("count");
                    if (count > 0) {
                        if (dbStatus == null || dbStatus.isEmpty()) {
                            dbStatus = "Chờ xác nhận";
                        }
                        result.put(dbStatus, result.getOrDefault(dbStatus, 0) + count);
                    }
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing order status distribution", e);
        }
        return result;
    }

    private List<Products> getTopSellingProducts(int limit) {
        List<Products> products = new ArrayList<>();
        String sql = "SELECT p.*, SUM(oi.quantity) as total_sold "
                + "FROM products p "
                + "JOIN order_items oi ON p.id = oi.product_id "
                + "JOIN orders o ON oi.order_id = o.id "
                + "WHERE o.status IN ('Paid', 'Giao hàng thành công') "
                + "GROUP BY p.id "
                + "ORDER BY total_sold DESC "
                + "OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY";

        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                throw new SQLException("Connection is null");
            }
            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Products p = new Products();
                        p.setId(rs.getInt("id"));
                        p.setName(rs.getString("name"));
                        p.setPrice(rs.getDouble("price"));
                        p.setDiscount_price(rs.getDouble("discount_price"));
                        p.setStock(rs.getInt("stock"));
                        p.setImage(rs.getString("image"));
                        p.setStatus(rs.getBoolean("status"));
                        products.add(p);
                    }
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error loading top selling products", e);
            List<Products> all = Database.getProductsDao().findAll();
            if (all == null) {
                return products;
            }
            return all.subList(0, Math.min(limit, all.size()));
        }
        return products;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }

    // ================== BẢNG CUNG CẦU ==================
    private List<Map<String, Object>> getSupplyDemandData(int limit) {
        List<Map<String, Object>> result = new ArrayList<>();
        // Cung = stock hiện tại, Cầu = tổng số lượng đã bán (trong orders không bị hủy/hoàn)
        String sql = "SELECT p.id, p.name, p.stock AS supply, "
                + "COALESCE(SUM(CASE WHEN o.status IN ('Paid','Giao hàng thành công','Đang giao','Đã xác nhận') THEN oi.quantity ELSE 0 END), 0) AS demand "
                + "FROM products p "
                + "LEFT JOIN order_items oi ON p.id = oi.product_id "
                + "LEFT JOIN orders o ON oi.order_id = o.id "
                + "GROUP BY p.id, p.name, p.stock "
                + "ORDER BY demand DESC, supply DESC "
                + "OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getInt("id"));
                    row.put("name", rs.getString("name"));
                    row.put("supply", rs.getInt("supply"));
                    row.put("demand", rs.getInt("demand"));
                    // Trạng thái cân bằng cung cầu
                    int supply = rs.getInt("supply");
                    int demand = rs.getInt("demand");
                    String state;
                    if (supply == 0) {
                        state = "HET_HANG";
                    } else if (demand > supply * 2) {
                        state = "HOT";
                    } else if (supply > demand * 3) {
                        state = "TON_KHO";
                    } else {
                        state = "CAN_BANG";
                    }
                    row.put("state", state);
                    result.add(row);
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error computing supply demand data", e);
        }
        return result;
    }

    // ================== HÀM THỐNG KÊ BÁN HÀNG ==================
    // Theo ngày: trả về Map<label, quantity> với label kiểu dd/MM
    private Map<String, Integer> getSalesByDay(int daysBack) {
        Map<String, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT CAST(o.created_at AS DATE) AS d, SUM(oi.quantity) AS total_qty "
                + "FROM orders o "
                + "JOIN order_items oi ON o.id = oi.order_id "
                + "WHERE o.created_at >= DATEADD(DAY, -?, CAST(GETDATE() AS DATE)) "
                + "GROUP BY CAST(o.created_at AS DATE) "
                + "ORDER BY d";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
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
        String sql = "SELECT DATEPART(YEAR, o.created_at) * 100 + DATEPART(ISO_WEEK, o.created_at) AS yw, SUM(oi.quantity) AS total_qty "
                + "FROM orders o "
                + "JOIN order_items oi ON o.id = oi.order_id "
                + "WHERE o.created_at >= DATEADD(WEEK, -?, CAST(GETDATE() AS DATE)) "
                + "GROUP BY DATEPART(YEAR, o.created_at) * 100 + DATEPART(ISO_WEEK, o.created_at) "
                + "ORDER BY yw";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
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
        String sql = "SELECT FORMAT(o.created_at, 'MM/yyyy') AS m, SUM(oi.quantity) AS total_qty "
                + "FROM orders o "
                + "JOIN order_items oi ON o.id = oi.order_id "
                + "WHERE o.created_at >= DATEADD(MONTH, -?, CAST(GETDATE() AS DATE)) "
                + "GROUP BY FORMAT(o.created_at, 'MM/yyyy') "
                + "ORDER BY MIN(o.created_at)";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
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
        String sql = "SELECT YEAR(o.created_at) AS y, SUM(oi.quantity) AS total_qty "
                + "FROM orders o "
                + "JOIN order_items oi ON o.id = oi.order_id "
                + "WHERE o.created_at >= DATEADD(YEAR, -?, CAST(GETDATE() AS DATE)) "
                + "GROUP BY YEAR(o.created_at) "
                + "ORDER BY y";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
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
        String sql = "SELECT COUNT(DISTINCT user_id) AS c "
                + "FROM orders "
                + "WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE) "
                + "AND user_id IS NOT NULL "
                + "AND user_id <> 0";
        try (Connection con = MySQLDriver.getConnection(); PreparedStatement ps = con.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
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
