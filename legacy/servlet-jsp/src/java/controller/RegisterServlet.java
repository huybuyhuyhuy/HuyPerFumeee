package controller;

import data.dao.Database;
import data.utils.PasswordUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.SQLException;
import model.User;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/register"})
public class RegisterServlet extends HttpServlet {

    private static final String EMAIL_REGEX = "^[\\w+.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$";
    private static final String PHONE_REGEX = "^\\d{10}$";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession s = request.getSession();
        Object once = s.getAttribute("exist_user");
        if (once != null) {
            request.setAttribute("exist_user", once);
            s.removeAttribute("exist_user");
        }
        request.setAttribute("title", "Register Page");
        request.getRequestDispatcher("/views/register.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession();

        String name = trim(request.getParameter("name"));
        String email = trim(request.getParameter("email"));
        String phone = trim(request.getParameter("phone"));
        String address = trim(request.getParameter("address"));
        String password = request.getParameter("password");
        String repassword = request.getParameter("repassword");

        boolean hasError = false;

        if (name.isEmpty()) {
            session.setAttribute("err_name", "Vui lòng nhập họ tên.");
            hasError = true;
        } else {
            session.removeAttribute("err_name");
        }

        if (email.isEmpty() || !email.matches(EMAIL_REGEX)) {
            session.setAttribute("err_email", email.isEmpty() ? "Vui lòng nhập email." : "Email không hợp lệ.");
            hasError = true;
        } else {
            session.removeAttribute("err_email");
        }

        if (phone.isEmpty() || !phone.matches(PHONE_REGEX)) {
            session.setAttribute("err_phone", phone.isEmpty() ? "Vui lòng nhập số điện thoại." : "Số điện thoại phải có 10 chữ số.");
            hasError = true;
        } else {
            session.removeAttribute("err_phone");
        }

        if (password == null || password.length() < 6) {
            session.setAttribute("err_pass", "Mật khẩu tối thiểu 6 ký tự.");
            hasError = true;
        } else {
            session.removeAttribute("err_pass");
        }

        if (repassword == null || !repassword.equals(password)) {
            session.setAttribute("err_repass", "Mật khẩu nhập lại không khớp.");
            hasError = true;
        } else {
            session.removeAttribute("err_repass");
        }

        try {
            if (!email.isEmpty() && Database.getUsersDao().findUser(email) != null) {
                session.setAttribute("err_exist_email", "Email đã được sử dụng.");
                hasError = true;
            } else {
                session.removeAttribute("err_exist_email");
            }
            if (!phone.isEmpty() && Database.getUsersDao().findUser(phone) != null) {
                session.setAttribute("err_exist_phone", "Số điện thoại đã được sử dụng.");
                hasError = true;
            } else {
                session.removeAttribute("err_exist_phone");
            }
        } catch (Exception e) {
            session.setAttribute("exist_user", "Không kiểm tra được dữ liệu. Thử lại sau.");
            hasError = true;
        }

        if (hasError) {
            session.removeAttribute("exist_user");
            session.setAttribute("name", name);
            session.setAttribute("email", email);
            session.setAttribute("phone", phone);
            session.setAttribute("address", address);
            response.sendRedirect(request.getContextPath() + "/register");
            return;
        }

        try {
            Database.getUsersDao().insertUser(name, email, phone, PasswordUtils.hash(password), address);
        } catch (SQLException e) {
            session.setAttribute("name", name);
            session.setAttribute("email", email);
            session.setAttribute("phone", phone);
            session.setAttribute("address", address);
            String m = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
            String msg;
            if ("23000".equals(e.getSQLState()) || m.contains("duplicate")) {
                msg = "Email hoặc số điện thoại đã tồn tại.";
            } else if (m.contains("access denied")) {
                msg = "Sai tài khoản/mật khẩu MySQL (USER/PASS trong Constants.java).";
            } else if (m.contains("unknown database") || m.contains("does not exist") && m.contains("database")) {
                msg = "Chưa có database `huyperfume`. Hãy chạy file `database_setup.sql` để tạo DB.";
            } else if (m.contains("table") && m.contains("doesn't exist")) {
                msg = "Thiếu bảng trong database. Hãy chạy `database_setup.sql` để tạo các bảng.";
            } else if (m.contains("communications link failure") || m.contains("connection refused")) {
                msg = "Không kết nối được MySQL. Kiểm tra MySQL service đang chạy và port 3306.";
            } else if (m.contains("incorrect string value") || m.contains("data truncation")) {
                msg = "Cột dữ liệu trong MySQL chưa dùng UTF-8. Hãy đổi bảng/cột `users` sang `utf8mb4`.";
            } else {
                msg = "Lỗi DB: " + e.getMessage();
            }
            session.setAttribute("exist_user", msg);
            response.sendRedirect(request.getContextPath() + "/register");
            return;
        }

        session.removeAttribute("name");
        session.removeAttribute("email");
        session.removeAttribute("phone");
        session.removeAttribute("address");
        session.removeAttribute("err_name");
        session.removeAttribute("err_email");
        session.removeAttribute("err_phone");
        session.removeAttribute("err_pass");
        session.removeAttribute("err_repass");
        session.removeAttribute("err_exist_email");
        session.removeAttribute("err_exist_phone");
        session.removeAttribute("exist_user");

        User user = Database.getUsersDao().findUser(email);
        if (user != null) {
            session.setAttribute("user", user);
            session.setAttribute("role", user.getRole());
            response.sendRedirect(request.getContextPath() + "/home");
        } else {
            session.setAttribute("exist_user", "Đã đăng ký nhưng không đăng nhập tự động được. Hãy đăng nhập thủ công.");
            response.sendRedirect(request.getContextPath() + "/register");
        }
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }
}
