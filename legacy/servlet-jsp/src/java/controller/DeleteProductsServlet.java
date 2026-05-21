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

@WebServlet(name = "DeleteProductsServlet", urlPatterns = {"/admin/product/delete"})
public class DeleteProductsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendError(HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Use POST to delete products.");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        User user = session == null ? null : (User) session.getAttribute("user");
        if (user == null || !"admin".equalsIgnoreCase(user.getRole())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String csrf = request.getParameter("csrfToken");
        String sessionToken = (String) session.getAttribute("adminCsrfToken");
        if (sessionToken == null || !sessionToken.equals(csrf)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid CSRF token.");
            return;
        }

        try {
            String idRaw = request.getParameter("id");
            if (idRaw != null && !idRaw.isEmpty()) {
                int id = Integer.parseInt(idRaw);
                Database.getProductsDao().delete(id);
            }
            response.sendRedirect(request.getContextPath() + "/admin?type=products");
        } catch (Exception e) {
            getServletContext().log("Error deleting product", e);
            response.sendRedirect(request.getContextPath() + "/admin?type=products&error=delete_failed");
        }
    }
}