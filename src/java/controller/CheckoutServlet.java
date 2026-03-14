package controller;

import data.dao.Database;
import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import model.Products;
import model.User;

@WebServlet(name = "CheckoutServlet", urlPatterns = {"/checkout"})
public class CheckoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        List<Products> cart = (List<Products>) session.getAttribute("cart");

        if (cart == null || cart.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/home");
            return;
        }

        String paymentMethod = request.getParameter("paymentMethod");
        User user = (User) session.getAttribute("user");
        int userId = (user != null) ? user.getId() : 0;

        double total = 0;
        for (Products p : cart) {
            double actualPrice = (p.getDiscount_price() > 0) ? p.getDiscount_price() : p.getPrice();
            total += actualPrice * p.getQuantity();
        }

        try (Connection con = MySQLDriver.getConnection()) {
            con.setAutoCommit(false);
            try {
                // 1. Insert Order
                int orderId = 0;
                String sqlOrder = "INSERT INTO orders (user_id, total, payment_method, status, created_at) VALUES (?, ?, ?, ?, NOW())";
                try (PreparedStatement ps = con.prepareStatement(sqlOrder, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, userId);
                    ps.setDouble(2, total);
                    ps.setString(3, paymentMethod);
                    ps.setString(4, "Chờ xác nhận");
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) orderId = rs.getInt(1);
                    }
                }

                // 2. Insert Items & Update Stock
                String sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                try (PreparedStatement psItem = con.prepareStatement(sqlItem)) {
                    for (Products p : cart) {
                        psItem.setInt(1, orderId);
                        psItem.setInt(2, p.getId());
                        psItem.setInt(3, p.getQuantity());
                        double actualPrice = (p.getDiscount_price() > 0) ? p.getDiscount_price() : p.getPrice();
                        psItem.setDouble(4, actualPrice);
                        psItem.addBatch();
                        
                        // Sử dụng DAO để cập nhật kho (nhưng trong cùng transaction thì dùng con này luôn cho an toàn)
                        // Tuy nhiên yêu cầu là dùng logic trừ kho, tôi sẽ dùng SQL trực tiếp ở đây để đảm bảo Transaction Atomicity
                        String sqlUpdateStock = "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?";
                        try (PreparedStatement psStock = con.prepareStatement(sqlUpdateStock)) {
                            psStock.setInt(1, p.getQuantity());
                            psStock.setInt(2, p.getId());
                            psStock.setInt(3, p.getQuantity());
                            int updated = psStock.executeUpdate();
                            if (updated == 0) {
                                throw new SQLException("Sản phẩm " + p.getName() + " đã hết hàng!");
                            }
                        }
                    }
                    psItem.executeBatch();
                }

                con.commit();
                session.removeAttribute("cart");
                request.setAttribute("paymentMethod", paymentMethod);
                request.getRequestDispatcher("/inc/success.jsp").forward(request, response);

            } catch (Exception ex) {
                con.rollback();
                request.setAttribute("errorMsg", ex.getMessage());
                request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
            } finally {
                con.setAutoCommit(true);
            }
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
