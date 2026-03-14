package controller;

import data.dao.Database;
import data.utils.API;
import data.utils.CartUtils;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import model.User;

@WebServlet(name = "LoginServlet", urlPatterns = {"/login"})
public class LoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Lấy target_id từ URL (ví dụ: /login?target_id=2)
        String targetId = request.getParameter("target_id");
        request.setAttribute("target_id", targetId);
        
        request.setAttribute("title", "Login Page");
        // Sử dụng forward thay vì include để đảm bảo render trang login chuẩn nhất
        request.getRequestDispatcher("./views/login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String emailphone = request.getParameter("emailphone");
        String password = request.getParameter("password");
        // Lấy target_id từ form ẩn (nếu có)
        String targetId = request.getParameter("target_id");
        
        User user = Database.getUsersDao().findUser(emailphone, API.getMd5(password));
        
        HttpSession session = request.getSession();
        
        if (user == null) {
            // Đăng nhập thất bại: Giữ lại target_id để user không phải quay lại trang chủ nhấn lại
            session.setAttribute("login_error", "Email/Số điện thoại hoặc Mật khẩu không đúng!");
            String redirectUrl = request.getContextPath() + "/login";
            if (targetId != null && !targetId.isEmpty()) {
                redirectUrl += "?target_id=" + targetId;
            }
            response.sendRedirect(redirectUrl);
        } else {
            // Đăng nhập thành công
            session.removeAttribute("login_error");
            
            // Lưu thông tin vào Session với tên "user" để đồng bộ toàn hệ thống
            session.setAttribute("user", user);
            session.setAttribute("role", user.getRole()); 
            
            // --- LOGIC TỰ ĐỘNG THÊM GIỎ HÀNG SAU LOGIN ---
            if (targetId != null && !targetId.isEmpty()) {
                CartUtils.addProductsToCart(request);
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
