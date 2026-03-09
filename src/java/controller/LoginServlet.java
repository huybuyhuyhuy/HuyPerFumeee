package controller;

import data.dao.Database;
import data.utils.API;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
<<<<<<< HEAD
import jakarta.servlet.http.HttpSession;
=======
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
import model.User;

@WebServlet(name = "LoginServlet", urlPatterns = {"/login"})
public class LoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
<<<<<<< HEAD
        // Lấy target_id từ URL (ví dụ: /login?target_id=2)
        String targetId = request.getParameter("target_id");
        request.setAttribute("target_id", targetId);
        
        request.setAttribute("title", "Login Page");
        // Sử dụng forward thay vì include để đảm bảo render trang login chuẩn nhất
        request.getRequestDispatcher("./views/login.jsp").forward(request, response);
=======
        request.setAttribute("title", "Login Page");
        request.getRequestDispatcher("./views/login.jsp").include(request, response);
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String emailphone = request.getParameter("emailphone");
        String password = request.getParameter("password");
<<<<<<< HEAD
        // Lấy target_id từ thẻ <input type="hidden"> trong login.jsp
=======
        // Lấy target_id từ form ẩn (nếu có)
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
        String targetId = request.getParameter("target_id");
        
        User user = Database.getUsersDao().findUser(emailphone, API.getMd5(password));
        
<<<<<<< HEAD
        HttpSession session = request.getSession();
        
        if (user == null) {
            // Đăng nhập thất bại: Giữ lại target_id trên URL của trang login để không bị mất dấu
            session.setAttribute("login_error", "Email/Số điện thoại hoặc Mật khẩu không đúng!");
=======
        if (user == null) {
            // Đăng nhập thất bại: Giữ lại target_id để user không phải quay lại trang chủ nhấn lại
            request.getSession().setAttribute("login_error", "Email/Số điện thoại hoặc Mật khẩu không đúng!");
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
            String redirectUrl = request.getContextPath() + "/login";
            if (targetId != null && !targetId.isEmpty()) {
                redirectUrl += "?target_id=" + targetId;
            }
            response.sendRedirect(redirectUrl);
        } else {
            // Đăng nhập thành công
<<<<<<< HEAD
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
=======
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
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
                response.sendRedirect(request.getContextPath() + "/home");
            }
        }
    }

    @Override
    public String getServletInfo() {
<<<<<<< HEAD
        return "Login Servlet with Auto-Add-To-Wishlist logic";
=======
        return "Login Servlet with Auto-Add-To-Cart logic";
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
    }
}