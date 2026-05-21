package controller;

import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import model.Products;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * MoMo redirect sau thanh toán (redirectUrl trong request tạo thanh toán).
 * Test: resultCode = 0 là thành công.
 */
@WebServlet(name = "MomoReturnServlet", urlPatterns = {"/momo-return"})
public class MomoReturnServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String resultCode = request.getParameter("resultCode");
        String transId = request.getParameter("transId");
        HttpSession session = request.getSession();

        Integer pendingOrderId = (Integer) session.getAttribute("MOMO_PENDING_ORDER_ID");
        session.removeAttribute("MOMO_PENDING_ORDER_ID");
        session.removeAttribute("MOMO_PENDING_MOMO_ORDER_ID");

        if ("0".equals(resultCode) && pendingOrderId != null) {
            double total = 0;
            List<Products> receiptItems = new ArrayList<>();
            try (Connection con = MySQLDriver.getConnection()) {
                if (con != null) {
                    String sql = "UPDATE orders SET status = ?, momo_trans_id = ? WHERE id = ?";
                    try (PreparedStatement ps = con.prepareStatement(sql)) {
                        ps.setString(1, "Paid");
                        ps.setString(2, transId);
                        ps.setInt(3, pendingOrderId);
                        ps.executeUpdate();
                    }
                    
                    // Fetch order total and items for success page
                    try (PreparedStatement psOrder = con.prepareStatement("SELECT total FROM orders WHERE id = ?")) {
                        psOrder.setInt(1, pendingOrderId);
                        try (ResultSet rs = psOrder.executeQuery()) {
                            if (rs.next()) total = rs.getDouble("total");
                        }
                    }
                    
                    try (PreparedStatement psItems = con.prepareStatement(
                            "SELECT oi.*, p.name, p.sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?")) {
                        psItems.setInt(1, pendingOrderId);
                        try (ResultSet rs = psItems.executeQuery()) {
                            while (rs.next()) {
                                Products p = new Products();
                                p.setName(rs.getString("name"));
                                p.setSku(rs.getString("sku"));
                                p.setBatch_code(rs.getString("selected_batch_code"));
                                receiptItems.add(p);
                            }
                        }
                    }
                }
            } catch (SQLException e) {
                getServletContext().log("Failed to process MoMo return", e);
            }
            request.setAttribute("paymentMethod", "Momo");
            request.setAttribute("orderId", pendingOrderId);
            request.setAttribute("orderTotal", total);
            request.setAttribute("receiptItems", receiptItems);
            request.getRequestDispatcher("/inc/success.jsp").forward(request, response);
        } else {
            request.setAttribute("momoError", "Thanh toán MoMo chưa hoàn tất hoặc đã hủy (resultCode=" + resultCode + ")");
            response.sendRedirect(request.getContextPath() + "/cart?momo=fail");
        }
    }
}
