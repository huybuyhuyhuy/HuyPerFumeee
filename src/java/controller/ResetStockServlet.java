package controller;

import data.dao.Database;
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

@WebServlet(name = "ResetStockServlet", urlPatterns = {"/admin/product/reset-stock"})
public class ResetStockServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Cập nhật tất cả sản phẩm: đặt trạng thái là 1 (CÒN HÀNG) và số lượng tồn kho mặc định là 50
        String sql = "UPDATE products SET status = 1, stock = 50";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            int updatedRows = ps.executeUpdate();
            System.out.println("Đã đặt lại trạng thái và kho hàng cho " + updatedRows + " sản phẩm.");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        response.sendRedirect(request.getContextPath() + "/admin");
    }
}
