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
import jakarta.servlet.http.HttpSession;
import model.User;

@WebServlet(name = "ResetStockServlet", urlPatterns = {"/admin/product/reset-stock"})
public class ResetStockServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendError(HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Use POST to reset stock.");
    }

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

        // Cập nhật tất cả sản phẩm: đặt trạng thái là 1 (CÒN HÀNG) và số lượng tồn kho mặc định là 50
        String sql = "UPDATE products SET status = 1, stock = 50";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            if (con == null) {
                throw new SQLException("Không kết nối được DB");
            }
            ps.executeUpdate();
        } catch (SQLException e) {
            getServletContext().log("Failed to reset product stock", e);
        }
        response.sendRedirect(request.getContextPath() + "/admin?type=products");
    }
}
