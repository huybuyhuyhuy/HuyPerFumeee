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
import java.sql.Timestamp;
import java.util.Date;
import model.User;

@WebServlet(name = "CancelOrderServlet", urlPatterns = {"/order/cancel"})
public class CancelOrderServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        String orderIdStr = request.getParameter("orderId");
        if (orderIdStr != null) {
            int orderId = Integer.parseInt(orderIdStr);
            try (Connection con = MySQLDriver.getConnection()) {
                // Check if order belongs to user and was placed < 5 minutes ago
                String checkSql = "SELECT created_at, status FROM orders WHERE id = ? AND user_id = ?";
                try (PreparedStatement ps = con.prepareStatement(checkSql)) {
                    ps.setInt(1, orderId);
                    ps.setInt(2, user.getId());
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            Timestamp createdAt = rs.getTimestamp("created_at");
                            String status = rs.getString("status");
                            
                            long diffInMs = new Date().getTime() - createdAt.getTime();
                            long diffInMin = diffInMs / (1000 * 60);
                            
                            if (diffInMin <= 5 && !"Đã hủy".equals(status) && !"Cancelled".equalsIgnoreCase(status)) {
                                // Cancel the order
                                String updateSql = "UPDATE orders SET status = 'Đã hủy' WHERE id = ?";
                                try (PreparedStatement up = con.prepareStatement(updateSql)) {
                                    up.setInt(1, orderId);
                                    up.executeUpdate();
                                    
                                    // Restore stock
                                    restoreStock(con, orderId);
                                }
                                response.sendRedirect(request.getContextPath() + "/order-history?success=cancelled");
                                return;
                            }
                        }
                    }
                }
            } catch (SQLException e) {
                getServletContext().log("Error cancelling order", e);
            }
        }
        
        response.sendRedirect(request.getContextPath() + "/order-history?error=cancel_failed");
    }

    private void restoreStock(Connection con, int orderId) throws SQLException {
        String sql = "UPDATE p SET p.stock = p.stock + oi.quantity FROM products p JOIN order_items oi ON p.id = oi.product_id WHERE oi.order_id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            ps.executeUpdate();
        }
    }
}
