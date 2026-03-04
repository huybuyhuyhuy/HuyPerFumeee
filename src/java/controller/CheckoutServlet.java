package controller;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(name = "CheckoutServlet", urlPatterns = {"/checkout"})
public class CheckoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        
        // 1. Kiểm tra giỏ hàng có tồn tại không
        if (session.getAttribute("cart") != null) {
            
            // 2. Lấy phương thức thanh toán
            String paymentMethod = request.getParameter("paymentMethod");
            
            // Ở ĐÂY: Bạn sẽ gọi OrderDAO để lưu đơn hàng vào Database
            // Ví dụ: orderDao.insertOrder(user, cart, paymentMethod);

            // 3. XÓA GIỎ HÀNG SAU KHI THANH TOÁN XONG
            session.removeAttribute("cart");
            
            // 4. Chuyển hướng sang trang thành công
         request.getRequestDispatcher("inc/success.jsp").forward(request, response);
        } else {
            // Nếu giỏ hàng trống mà truy cập checkout, đẩy về trang chủ
            response.sendRedirect(request.getContextPath() + "/home");
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendRedirect(request.getContextPath() + "/home");
    }
}