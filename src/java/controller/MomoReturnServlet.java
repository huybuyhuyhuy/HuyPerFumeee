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
        HttpSession session = request.getSession();

        Integer pendingOrderId = (Integer) session.getAttribute("MOMO_PENDING_ORDER_ID");
        session.removeAttribute("MOMO_PENDING_ORDER_ID");
        session.removeAttribute("MOMO_PENDING_MOMO_ORDER_ID");

        if ("0".equals(resultCode) && pendingOrderId != null) {
            try (Connection con = MySQLDriver.getConnection()) {
                if (con != null) {
                    String sql = "UPDATE orders SET status = ? WHERE id = ?";
                    try (PreparedStatement ps = con.prepareStatement(sql)) {
                        ps.setString(1, "Đã thanh toán MoMo");
                        ps.setInt(2, pendingOrderId);
                        ps.executeUpdate();
                    }
                }
            } catch (SQLException e) {
                getServletContext().log("Failed to update MoMo payment status", e);
            }
            request.setAttribute("paymentMethod", "Momo");
            request.getRequestDispatcher("/inc/success.jsp").forward(request, response);
        } else {
            request.setAttribute("momoError", "Thanh toán MoMo chưa hoàn tất hoặc đã hủy (resultCode=" + resultCode + ")");
            response.sendRedirect(request.getContextPath() + "/cart?momo=fail");
        }
    }
}
