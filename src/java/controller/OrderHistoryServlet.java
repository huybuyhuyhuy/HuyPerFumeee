package controller;

import data.dao.Database;
import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import model.User;

@WebServlet(name = "OrderHistoryServlet", urlPatterns = {"/order-history"})
public class OrderHistoryServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        List<Map<String, Object>> orders = new ArrayList<>();
        String sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC";
        
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, user.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> order = new LinkedHashMap<>();
                    int orderId = rs.getInt("id");
                    order.put("id", orderId);
                    order.put("total", rs.getDouble("total"));
                    order.put("payment_method", rs.getString("payment_method"));
                    order.put("created_at", rs.getTimestamp("created_at"));
                    
                    List<Map<String, Object>> items = new ArrayList<>();
                    String sqlItems = "SELECT oi.*, p.name, p.image FROM order_items oi " +
                                     "JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?";
                    try (PreparedStatement psItems = con.prepareStatement(sqlItems)) {
                        psItems.setInt(1, orderId);
                        try (ResultSet rsItems = psItems.executeQuery()) {
                            while (rsItems.next()) {
                                Map<String, Object> item = new LinkedHashMap<>();
                                item.put("name", rsItems.getString("name"));
                                item.put("image", rsItems.getString("image"));
                                item.put("quantity", rsItems.getInt("quantity"));
                                item.put("price", rsItems.getDouble("price"));
                                items.add(item);
                            }
                        }
                    }
                    order.put("items", items);
                    orders.add(order);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        request.setAttribute("orders", orders);
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("pageTitle", "Lịch sử mua hàng");
        request.getRequestDispatcher("/views/order-history.jsp").forward(request, response);
    }
}
