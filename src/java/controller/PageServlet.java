package controller;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "PageServlet", urlPatterns = {"/about", "/knowledge", "/blog", "/contact"})
public class PageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getServletPath();
        String pageTitle = "";
        String jspPath = "";

        switch (path) {
            case "/about":
                pageTitle = "Giới thiệu";
                jspPath = "/views/about.jsp";
                break;
            case "/knowledge":
                pageTitle = "Kiến thức nước hoa";
                jspPath = "/views/knowledge.jsp";
                break;
            case "/blog":
                pageTitle = "Blog";
                jspPath = "/views/blog.jsp";
                break;
            case "/contact":
                pageTitle = "Liên hệ";
                jspPath = "/views/contact.jsp";
                break;
        }

        // Cung cấp dữ liệu cho Navbar
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());

        request.setAttribute("pageTitle", pageTitle);
        request.getRequestDispatcher(jspPath).forward(request, response);
    }
}
