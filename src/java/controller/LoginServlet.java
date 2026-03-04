package controller;

import data.dao.Database;
import data.utils.API;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.User;

@WebServlet(name = "LoginServlet", urlPatterns = {"/login"})
public class LoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("title", "Login Page");
        request.getRequestDispatcher("./views/login.jsp").include(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String emailphone = request.getParameter("emailphone");
        String password = request.getParameter("password");
        // Lấy target_id từ form ẩn (nếu có)
        String targetId = request.getParameter("target_id");
        
        User user = Database.getUsersDao().findUser(emailphone, API.getMd5(password));
        
        if (user == null) {
            // Đăng nhập thất bại: Giữ lại target_id để user không phải quay lại trang chủ nhấn lại
            request.getSession().setAttribute("login_error", "Email/Số điện thoại hoặc Mật khẩu không đúng!");
            String redirectUrl = request.getContextPath() + "/login";
            if (targetId != null && !targetId.isEmpty()) {
                redirectUrl += "?target_id=" + targetId;
            }
            response.sendRedirect(redirectUrl);
        } else {
            // Đăng nhập thành công
            request.getSession().removeAttribute("login_error");
            
            // Lưu thông tin vào Session với tên "user" để đồng bộ toàn hệ thống
            request.getSession().setAttribute("user", user);
            request.getSession().setAttribute("role", user.getRole()); 
            
            // --- LOGIC TỰ ĐỘNG THÊM GIỎ HÀNG SAU LOGIN ---
            if (targetId != null && !targetId.isEmpty()) {
                // Khởi tạo HomeServlet để dùng hàm addProductsToCart đã viết sẵn
                HomeServlet home = new HomeServlet();
                home.addProductsToCart(request);
            }
            // ----------------------------------------------

            String userRole = user.getRole();
            if (userRole != null && userRole.equals("admin")) {
                response.sendRedirect(request.getContextPath() + "/admin"); 
            } else {
                // Sau khi login và tự add cart xong, đưa user về home
                response.sendRedirect(request.getContextPath() + "/home");
            }
        }
    }

    @Override
    public String getServletInfo() {
        return "Login Servlet with Auto-Add-To-Cart logic";
    }
}