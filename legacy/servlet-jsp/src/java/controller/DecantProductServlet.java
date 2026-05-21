package controller;

import data.driver.MySQLDriver;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import model.User;

@WebServlet(name = "DecantProductServlet", urlPatterns = {"/admin/product/decant"})
public class DecantProductServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        User user = session == null ? null : (User) session.getAttribute("user");
        if (user == null || !"admin".equalsIgnoreCase(user.getRole())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String csrf = request.getParameter("csrfToken");
        String sessionToken = (String) session.getAttribute("adminCsrfToken");
        if (sessionToken == null || !sessionToken.equals(csrf)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid CSRF token.");
            return;
        }

        int sourceId = parseInt(request.getParameter("id"), -1);
        int decantQty = parseInt(request.getParameter("decantQty"), 1);
        int decantVolume = parseInt(request.getParameter("decantVolume"), 10);
        if (sourceId <= 0 || decantQty <= 0 || decantVolume <= 0) {
            response.sendRedirect(request.getContextPath() + "/admin?type=products&error=decant_invalid");
            return;
        }
        // Tổng ml cần chiết = decantQty * decantVolume
        int totalMlNeeded = decantQty * decantVolume;

        try (Connection con = MySQLDriver.getConnection()) {
            con.setAutoCommit(false);
            try {
                ProductRow src = loadSourceProduct(con, sourceId);
                if (src == null) {
                    throw new SQLException("Không tìm thấy sản phẩm nguồn.");
                }
                if (src.isDecant) {
                    throw new SQLException("Sản phẩm nguồn đã là hàng chiết.");
                }
                if (src.stock < totalMlNeeded) {
                    throw new SQLException("Không đủ ml trong chai để chiết. Cần " + totalMlNeeded + "ml nhưng còn " + src.stock + "ml.");
                }

                String decantSku = buildDecantSku(src.sku, src.id, decantVolume);
                int decantId = findProductIdBySku(con, decantSku);
                String decantName = src.name + " - Chiet " + decantVolume + "ml";
                String decantBatch = (src.batchCode == null || src.batchCode.isBlank()) ? "DECANT" : src.batchCode + "-DECANT";
                double decantPrice = Math.round((src.price * decantVolume / 100.0) * 100.0) / 100.0;
                if (decantPrice <= 0) {
                    decantPrice = src.price;
                }

                // Trừ đúng số ml khỏi chai nguồn
                decreaseSourceStock(con, src.id, totalMlNeeded);
                if (decantId > 0) {
                    increaseDecantStock(con, decantId, decantQty, decantBatch);
                } else {
                    insertDecantProduct(con, src, decantSku, decantName, decantBatch, decantPrice, decantQty, decantVolume);
                }

                con.commit();
                response.sendRedirect(request.getContextPath() + "/admin?type=products&success=decanted");
            } catch (Exception e) {
                con.rollback();
                getServletContext().log("Failed to decant product", e);
                response.sendRedirect(request.getContextPath() + "/admin?type=products&error=decant_failed");
            } finally {
                con.setAutoCommit(true);
            }
        } catch (SQLException e) {
            getServletContext().log("Cannot process decant", e);
            response.sendRedirect(request.getContextPath() + "/admin?type=products&error=decant_failed");
        }
    }

    private ProductRow loadSourceProduct(Connection con, int id) throws SQLException {
        String sql = "SELECT id, name, price, image, id_category, id_brand, stock, status, sku, batch_code, scent_notes, is_decant FROM products WITH (UPDLOCK, ROWLOCK) WHERE id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ProductRow p = new ProductRow();
                    p.id = rs.getInt("id");
                    p.name = rs.getString("name");
                    p.price = rs.getDouble("price");
                    p.image = rs.getString("image");
                    p.categoryId = rs.getInt("id_category");
                    p.brandId = rs.getInt("id_brand");
                    p.stock = rs.getInt("stock");
                    p.status = rs.getBoolean("status");
                    p.sku = rs.getString("sku");
                    p.batchCode = rs.getString("batch_code");
                    p.scentNotes = rs.getString("scent_notes");
                    p.isDecant = rs.getBoolean("is_decant");
                    return p;
                }
            }
        }
        return null;
    }

    private int findProductIdBySku(Connection con, String sku) throws SQLException {
        String sql = "SELECT id FROM products WITH (UPDLOCK, ROWLOCK) WHERE sku = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, sku);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("id");
            }
        }
        return -1;
    }

    private void decreaseSourceStock(Connection con, int sourceId, int mlToDeduct) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")) {
            ps.setInt(1, mlToDeduct);
            ps.setInt(2, sourceId);
            ps.setInt(3, mlToDeduct);
            int updated = ps.executeUpdate();
            if (updated == 0) {
                throw new SQLException("Không thể trừ " + mlToDeduct + "ml khỏi chai nguồn.");
            }
        }
    }

    private void increaseDecantStock(Connection con, int decantId, int qty, String batchCode) throws SQLException {
        String sql = "UPDATE products SET stock = stock + ?, status = 1, batch_code = ? WHERE id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, qty);
            ps.setString(2, batchCode);
            ps.setInt(3, decantId);
            ps.executeUpdate();
        }
    }

    private void insertDecantProduct(Connection con, ProductRow src, String decantSku, String decantName, String decantBatch,
            double decantPrice, int decantQty, int decantVolume) throws SQLException {
        // stock của sản phẩm decant = số chai (decantQty), mỗi chai decantVolume ml
        String sql = "INSERT INTO products (sku, batch_code, name, price, image, scent_notes, is_decant, status, id_category, id_brand, stock, discount_price) "
                + "VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, decantSku);
            ps.setString(2, decantBatch);
            ps.setString(3, decantName);
            ps.setDouble(4, decantPrice);
            ps.setString(5, src.image);
            ps.setString(6, src.scentNotes);
            ps.setBoolean(7, src.status);
            ps.setInt(8, src.categoryId);
            ps.setInt(9, src.brandId);
            ps.setInt(10, decantQty);
            ps.executeUpdate();
        }
    }

    private String buildDecantSku(String sourceSku, int sourceId, int decantVolume) {
        String base = (sourceSku == null || sourceSku.isBlank()) ? "SKU-" + sourceId : sourceSku;
        return base + "-DECANT-" + decantVolume + "ML";
    }

    private int parseInt(String raw, int fallback) {
        try {
            return Integer.parseInt(raw);
        } catch (Exception e) {
            return fallback;
        }
    }

    private static class ProductRow {
        int id;
        int categoryId;
        int brandId;
        int stock;
        String name;
        String image;
        String sku;
        String batchCode;
        String scentNotes;
        double price;
        boolean status;
        boolean isDecant;
    }
}
