package controller;

import com.google.gson.Gson;
import data.driver.MySQLDriver;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AdminOrderDetailServlet", urlPatterns = {"/admin/order/detail"})
public class AdminOrderDetailServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String idStr = request.getParameter("id");
        if (idStr == null || idStr.isBlank()) {
            response.sendError(400, "Missing order ID");
            return;
        }

        int orderId = Integer.parseInt(idStr);
        List<Map<String, Object>> items = new ArrayList<>();
        
        String sql = "SELECT oi.id as item_id, oi.product_id, oi.quantity, oi.price, oi.status, p.name, p.image "
                + "FROM order_items oi "
                + "JOIN products p ON oi.product_id = p.id "
                + "WHERE oi.order_id = ?";

        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                response.sendError(500, "Database connection failed");
                return;
            }
            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, orderId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("itemId", rs.getInt("item_id"));
                        item.put("productId", rs.getInt("product_id"));
                        item.put("name", rs.getString("name"));
                        item.put("image", rs.getString("image"));
                        item.put("quantity", rs.getInt("quantity"));
                        item.put("price", rs.getDouble("price"));
                        item.put("status", rs.getString("status"));
                        items.add(item);
                    }
                }
            }
        } catch (SQLException e) {
            getServletContext().log("Error loading order items", e);
            response.sendError(500);
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(GSON.toJson(items));
    }
}
