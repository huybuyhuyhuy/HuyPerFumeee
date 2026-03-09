package controller;

import data.dao.Database;
import data.utils.API;
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
        // Lấy target_id từ thẻ <input type="hidden"> trong login.jsp
        String targetId = request.getParameter("target_id");
        
        User user = Database.getUsersDao().findUser(emailphone, API.getMd5(password));
        
        HttpSession session = request.getSession();
        
        if (user == null) {
            // Đăng nhập thất bại: Giữ lại target_id trên URL của trang login để không bị mất dấu
            session.setAttribute("login_error", "Email/Số điện thoại hoặc Mật khẩu không đúng!");
            String redirectUrl = request.getContextPath() + "/login";
            if (targetId != null && !targetId.isEmpty()) {
                redirectUrl += "?target_id=" + targetId;
            }
            response.sendRedirect(redirectUrl);
        } else {
            // Đăng nhập thành công
            session.removeAttribute("login_error");
            session.setAttribute("user", user);
            session.setAttribute("role", user.getRole()); 
            
            String userRole = user.getRole();
            
            // --- LOGIC ĐIỀU HƯỚNG VỀ YÊU THÍCH ---
            if (targetId != null && !targetId.isEmpty()) {
                // Chuyển hướng trực tiếp sang WishlistServlet kèm action và id sản phẩm
                // Lệnh này sẽ kích hoạt logic thêm sản phẩm của WishlistServlet
                response.sendRedirect(request.getContextPath() + "/wishlist?action=add&id=" + targetId);
                return; // Quan trọng: Ngắt luồng xử lý tại đây
            }
            // --------------------------------------

            // Điều hướng mặc định nếu không có target_id
            if (userRole != null && userRole.equals("admin")) {
                response.sendRedirect(request.getContextPath() + "/admin"); 
            } else {
                response.sendRedirect(request.getContextPath() + "/home");
            }
        }
    }

    @Override
    public String getServletInfo() {
        return "Login Servlet with Auto-Add-To-Wishlist logic";
    }
}