package controller;

import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
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
        
        String orderIdStr = request.getParameter("orderId");
        String status = request.getParameter("status");

        if (orderIdStr != null && status != null) {
            int orderId = Integer.parseInt(orderIdStr);
            String sql = "UPDATE orders SET status = ? WHERE id = ?";
            
            try (Connection con = MySQLDriver.getConnection();
                 PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setString(1, status);
                ps.setInt(2, orderId);
                ps.executeUpdate();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        
        // Quay lại trang quản lý đơn hàng
        response.sendRedirect(request.getContextPath() + "/admin?type=orders");
    }
}
