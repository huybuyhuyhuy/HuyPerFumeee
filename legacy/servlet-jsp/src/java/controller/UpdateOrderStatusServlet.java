package controller;

import data.utils.MomoNodeClient;
import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "UpdateOrderStatusServlet", urlPatterns = {"/admin/order/update-status"})
public class UpdateOrderStatusServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String action = request.getParameter("action");
        String orderIdStr = request.getParameter("orderId");
        String status = request.getParameter("status");

        if ("return_item".equalsIgnoreCase(action)) {
            String itemIdStr = request.getParameter("itemId");
            if (orderIdStr != null && itemIdStr != null) {
                try (Connection con = MySQLDriver.getConnection()) {
                    processItemReturn(con, Integer.parseInt(orderIdStr), Integer.parseInt(itemIdStr));
                } catch (Exception e) {
                    getServletContext().log("Failed to return item", e);
                }
            }
        } else if (orderIdStr != null && status != null) {
            int orderId = Integer.parseInt(orderIdStr);
            try (Connection con = MySQLDriver.getConnection()) {
                // Xử lý hoàn tiền khi chọn "Đã hoàn tiền" hoặc "Refunded"
                if ("Refunded".equalsIgnoreCase(status) || "Đã hoàn tiền".equalsIgnoreCase(status)) {
                    processRefundManual(con, orderId);
                } else {
                    String sql = "UPDATE orders SET status = ? WHERE id = ?";
                    try (PreparedStatement ps = con.prepareStatement(sql)) {
                        ps.setString(1, status);
                        ps.setInt(2, orderId);
                        ps.executeUpdate();
                    }
                }
            } catch (SQLException e) {
                getServletContext().log("Failed to update order status", e);
            } catch (Exception e) {
                getServletContext().log("Failed to process refund", e);
            }
        }
        
        // Quay lại trang quản lý đơn hàng
        response.sendRedirect(request.getContextPath() + "/admin?type=orders");
    }

    private void processItemReturn(Connection con, int orderId, int itemId) throws SQLException {
        con.setAutoCommit(false);
        try {
            // 1. Get item price and quantity to deduct
            double priceToDeduct = 0;
            int productId = -1;
            int quantity = 0;
            String checkSql = "SELECT price, product_id, quantity, status FROM order_items WHERE id = ? AND order_id = ?";
            try (PreparedStatement ps = con.prepareStatement(checkSql)) {
                ps.setInt(1, itemId);
                ps.setInt(2, orderId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        if ("Returned".equalsIgnoreCase(rs.getString("status"))) {
                            throw new SQLException("Item already returned");
                        }
                        priceToDeduct = rs.getDouble("price");
                        productId = rs.getInt("product_id");
                        quantity = rs.getInt("quantity");
                    } else {
                        throw new SQLException("Item not found in order");
                    }
                }
            }

            // 2. Update item status to 'Returned'
            String updateItemSql = "UPDATE order_items SET status = 'Returned' WHERE id = ?";
            try (PreparedStatement ps = con.prepareStatement(updateItemSql)) {
                ps.setInt(1, itemId);
                ps.executeUpdate();
            }

            // 3. Deduct total amount from order
            String updateOrderSql = "UPDATE orders SET total = total - ? WHERE id = ?";
            try (PreparedStatement ps = con.prepareStatement(updateOrderSql)) {
                ps.setDouble(1, priceToDeduct);
                ps.setInt(2, orderId);
                ps.executeUpdate();
            }

            // 4. Restore stock
            String updateStockSql = "UPDATE products SET stock = stock + ? WHERE id = ?";
            try (PreparedStatement ps = con.prepareStatement(updateStockSql)) {
                ps.setInt(1, quantity);
                ps.setInt(2, productId);
                ps.executeUpdate();
            }

            con.commit();
        } catch (SQLException e) {
            con.rollback();
            throw e;
        } finally {
            con.setAutoCommit(true);
        }
    }

    private void processRefundManual(Connection con, int orderId) throws Exception {
        con.setAutoCommit(false);
        try {
            // Lấy thông tin đơn hàng
            String checkSql = "SELECT status, total, momo_order_id, momo_trans_id FROM orders WHERE id = ?";
            String currentStatus = null;
            double totalAmount = 0;
            String momoOrderId = null;
            String momoTransId = null;
            try (PreparedStatement ps = con.prepareStatement(checkSql)) {
                ps.setInt(1, orderId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        currentStatus = rs.getString("status");
                        totalAmount = rs.getDouble("total");
                        momoOrderId = rs.getString("momo_order_id");
                        momoTransId = rs.getString("momo_trans_id");
                    } else {
                        throw new SQLException("Không tìm thấy đơn hàng #" + orderId);
                    }
                }
            }

            // Nếu là đơn MoMo đã Paid → thử hoàn qua API MoMo
            if ("Paid".equalsIgnoreCase(currentStatus)
                    && momoOrderId != null && !momoOrderId.isBlank()
                    && momoTransId != null && !momoTransId.isBlank()) {
                try {
                    MomoNodeClient.refundPayment(momoOrderId, momoTransId, Math.round(totalAmount), "Refund order #" + orderId);
                } catch (Exception ex) {
                    getServletContext().log("MoMo refund API failed, proceeding manual refund", ex);
                }
            }

            // Khôi phục tồn kho
            restoreStock(con, orderId);

            // Đặt total về 0 và cập nhật trạng thái → đây là bước "trừ doanh thu"
            String updateSql = "UPDATE orders SET status = 'Đã hoàn tiền', total = 0 WHERE id = ?";
            try (PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setInt(1, orderId);
                ps.executeUpdate();
            }

            con.commit();
        } catch (Exception e) {
            con.rollback();
            throw e;
        } finally {
            con.setAutoCommit(true);
        }
    }

    // Giữ lại processRefund cũ cho MoMo (không còn được gọi từ doPost nhưng dùng dự phòng)
    private void processRefund(Connection con, int orderId) throws Exception {
        con.setAutoCommit(false);
        try {
            OrderPaymentMeta meta = getOrderPaymentMeta(con, orderId);
            if (meta == null) {
                throw new SQLException("Không tìm thấy đơn hàng.");
            }
            MomoNodeClient.refundPayment(meta.momoOrderId, meta.momoTransId, Math.round(meta.totalAmount), "Refund order #" + orderId);
            restoreStock(con, orderId);
            updateOrderStatus(con, orderId, "Đã hoàn tiền");
            // Trừ doanh thu: đặt total = 0
            try (PreparedStatement ps = con.prepareStatement("UPDATE orders SET total = 0 WHERE id = ?")) {
                ps.setInt(1, orderId);
                ps.executeUpdate();
            }
            con.commit();
        } catch (Exception e) {
            con.rollback();
            throw e;
        } finally {
            con.setAutoCommit(true);
        }
    }

    private void restoreStock(Connection con, int orderId) throws SQLException {
        String sql = "UPDATE p SET p.stock = p.stock + oi.quantity FROM products p JOIN order_items oi ON p.id = oi.product_id WHERE oi.order_id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            ps.executeUpdate();
        }
    }

    private void updateOrderStatus(Connection con, int orderId, String status) throws SQLException {
        String sql = "UPDATE orders SET status = ? WHERE id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, orderId);
            ps.executeUpdate();
        }
    }

    private OrderPaymentMeta getOrderPaymentMeta(Connection con, int orderId) throws SQLException {
        String sql = "SELECT total, status, momo_order_id, momo_trans_id FROM orders WHERE id = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    OrderPaymentMeta meta = new OrderPaymentMeta();
                    meta.totalAmount = rs.getDouble("total");
                    meta.status = rs.getString("status");
                    meta.momoOrderId = rs.getString("momo_order_id");
                    meta.momoTransId = rs.getString("momo_trans_id");
                    return meta;
                }
            }
        }
        return null;
    }

    private static class OrderPaymentMeta {
        private double totalAmount;
        private String status;
        private String momoOrderId;
        private String momoTransId;
    }
}
