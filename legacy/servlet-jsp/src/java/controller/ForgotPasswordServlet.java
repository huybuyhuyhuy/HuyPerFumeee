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

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {"/forgot-password"})
public class ForgotPasswordServlet extends HttpServlet {

    private static final String SESSION_EMAIL = "forgot_reset_email";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        fillNav(request);
        request.setAttribute("pageTitle", "Quên mật khẩu");
        request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        fillNav(request);
        request.setAttribute("pageTitle", "Quên mật khẩu");

        HttpSession session = request.getSession();

        if ("reset".equals(request.getParameter("step"))) {
            String verifiedEmail = (String) session.getAttribute(SESSION_EMAIL);
            if (verifiedEmail == null || verifiedEmail.isBlank()) {
                request.setAttribute("errorMsg", "Phiên đã hết hạn. Vui lòng nhập email lại.");
                request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
                return;
            }

            String newPass = request.getParameter("newPassword");
            String confirm = request.getParameter("confirmPassword");
            if (newPass == null || newPass.length() < 6) {
                request.setAttribute("errorMsg", "Mật khẩu mới tối thiểu 6 ký tự.");
                request.setAttribute("showResetForm", Boolean.TRUE);
                request.setAttribute("email", verifiedEmail);
                request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
                return;
            }
            if (confirm == null || !confirm.equals(newPass)) {
                request.setAttribute("errorMsg", "Mật khẩu nhập lại không khớp.");
                request.setAttribute("showResetForm", Boolean.TRUE);
                request.setAttribute("email", verifiedEmail);
                request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
                return;
            }

            try {
                Database.getUsersDao().updatePasswordByEmail(verifiedEmail, PasswordUtils.hash(newPass));
                session.removeAttribute(SESSION_EMAIL);
                request.setAttribute("successMsg", "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.");
            } catch (SQLException e) {
                request.setAttribute("errorMsg", "Không cập nhật được mật khẩu. Thử lại sau.");
                request.setAttribute("showResetForm", Boolean.TRUE);
                request.setAttribute("email", verifiedEmail);
            }
            request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
            return;
        }

        String email = request.getParameter("email");
        if (email == null || email.isBlank() || !email.contains("@")) {
            request.setAttribute("errorMsg", "Vui lòng nhập email hợp lệ.");
            request.setAttribute("email", email == null ? "" : email);
            request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
            return;
        }
        email = email.trim();

        User user = Database.getUsersDao().findUser(email);
        if (user == null) {
            request.setAttribute("errorMsg", "Email chưa được đăng ký.");
            request.setAttribute("email", email);
        } else {
            session.setAttribute(SESSION_EMAIL, email);
            request.setAttribute("showResetForm", Boolean.TRUE);
            request.setAttribute("email", email);
            request.setAttribute("successMsg", "Xác nhận email thành công. Nhập mật khẩu mới bên dưới.");
        }
        request.getRequestDispatcher("/views/forgot-password.jsp").forward(request, response);
    }

    private void fillNav(HttpServletRequest request) {
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
    }
}
