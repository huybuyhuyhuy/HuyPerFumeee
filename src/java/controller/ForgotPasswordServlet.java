package controller;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.User;

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {"/forgot-password"})
public class ForgotPasswordServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Cung cấp dữ liệu cho Navbar
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("pageTitle", "Quên mật khẩu");
        
        request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = request.getParameter("email");
        
        // Kiểm tra user có tồn tại không
        User user = Database.getUsersDao().findUser(email);
        
        if (user != null) {
            // Trong thực tế sẽ gửi Email, ở đây ta thông báo giả lập thành công
            request.setAttribute("successMsg", "Yêu cầu đã được gửi! Vui lòng kiểm tra email " + email + " để nhận hướng dẫn khôi phục.");
        } else {
            request.setAttribute("errorMsg", "Email này chưa được đăng ký trong hệ thống của chúng tôi.");
        }
        
        // Cung cấp lại dữ liệu cho Navbar khi forward lại trang
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.setAttribute("pageTitle", "Quên mật khẩu");
        request.setAttribute("email", email); // Giữ lại email đã nhập
        
        request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
    }
}
