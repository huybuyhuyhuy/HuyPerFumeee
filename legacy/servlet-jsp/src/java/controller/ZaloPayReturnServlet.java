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
import java.util.ArrayList;
import java.util.List;
import model.Products;

@WebServlet(name = "ZaloPayReturnServlet", urlPatterns = {"/zalopay-return"})
public class ZaloPayReturnServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        Integer pendingOrderId = (Integer) session.getAttribute("ZALOPAY_PENDING_ORDER_ID");
        session.removeAttribute("ZALOPAY_PENDING_ORDER_ID");

        if (pendingOrderId != null) {
            double total = 0;
            List<Products> receiptItems = new ArrayList<>();
            try (Connection con = MySQLDriver.getConnection()) {
                if (con != null) {
                    // Update order status
                    try (PreparedStatement ps = con.prepareStatement("UPDATE orders SET status = ? WHERE id = ?")) {
                        ps.setString(1, "Paid");
                        ps.setInt(2, pendingOrderId);
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
                getServletContext().log("Failed to process ZaloPay return", e);
            }
            request.setAttribute("paymentMethod", "ZaloPay");
            request.setAttribute("orderId", pendingOrderId);
            request.setAttribute("orderTotal", total);
            request.setAttribute("receiptItems", receiptItems);
            request.getRequestDispatcher("/inc/success.jsp").forward(request, response);
            return;
        }

        response.sendRedirect(request.getContextPath() + "/cart?zalopay=fail");
    }
}
