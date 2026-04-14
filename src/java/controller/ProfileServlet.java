package controller;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import model.User;

@WebServlet(name = "ProfileServlet", urlPatterns = {"/profile"})
public class ProfileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            response.sendRedirect("login");
            return;
        }
        
        request.getRequestDispatcher("/views/profile.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        
        if (user == null) {
            response.sendRedirect("login");
            return;
        }
        
        try {
            String name = request.getParameter("name");
            String phone = request.getParameter("phone");
            String dob = request.getParameter("dob");
            String address = request.getParameter("address");
            
            user.setName(name);
            user.setPhone(phone);
            user.setDob(dob);
            user.setAddress(address);
            
            Database.getUsersDao().updateUser(user);
            
            // Cập nhật lại user trong session
            session.setAttribute("user", user);
            request.setAttribute("successMsg", "Cập nhật thông tin thành công!");
        } catch (Exception e) {
            getServletContext().log("Error updating user profile", e);
            request.setAttribute("errorMsg", "Có lỗi xảy ra khi cập nhật!");
        }
        
        request.getRequestDispatcher("/views/profile.jsp").forward(request, response);
    }
}
