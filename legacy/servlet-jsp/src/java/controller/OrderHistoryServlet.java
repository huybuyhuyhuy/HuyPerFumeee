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
        String sql = "SELECT o.id, o.total, o.payment_method, o.created_at, "
                + "oi.quantity, oi.price, p.name, p.image "
                + "FROM orders o "
                + "LEFT JOIN order_items oi ON o.id = oi.order_id "
                + "LEFT JOIN products p ON p.id = oi.product_id "
                + "WHERE o.user_id = ? "
                + "ORDER BY o.id DESC, oi.id ASC";
        
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, user.getId());
            try (ResultSet rs = ps.executeQuery()) {
                Map<Integer, Map<String, Object>> orderMap = new LinkedHashMap<>();
                while (rs.next()) {
                    int orderId = rs.getInt("id");
                    Map<String, Object> order = orderMap.get(orderId);
                    if (order == null) {
                        order = new LinkedHashMap<>();
                        order.put("id", orderId);
                        order.put("total", rs.getDouble("total"));
                        order.put("payment_method", rs.getString("payment_method"));
                        order.put("created_at", rs.getTimestamp("created_at"));
                        order.put("items", new ArrayList<Map<String, Object>>());
                        orderMap.put(orderId, order);
                    }
                    if (rs.getString("name") != null) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> items = (List<Map<String, Object>>) order.get("items");
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("name", rs.getString("name"));
                        item.put("image", rs.getString("image"));
                        item.put("quantity", rs.getInt("quantity"));
                        item.put("price", rs.getDouble("price"));
                        items.add(item);
                    }
                }
                orders = new ArrayList<>(orderMap.values());
            }
        } catch (SQLException e) {
            getServletContext().log("Error loading order history", e);
        }

        request.setAttribute("orders", orders);
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("pageTitle", "Lịch sử mua hàng");
        request.getRequestDispatcher("/views/order-history.jsp").forward(request, response);
    }
}
