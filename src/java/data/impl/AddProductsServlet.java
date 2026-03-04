package data.impl;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.Products;

// SỬA: Đổi "/add" thành đường dẫn khớp với link trong _admin.jsp
@WebServlet(name = "AddProductsServlet", urlPatterns = {"/admin/product/add"})
public class AddProductsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Forward đến đúng file trong thư mục inc
        request.getRequestDispatcher("/inc/add-products.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        try {
            String name = request.getParameter("name");
            double price = Double.parseDouble(request.getParameter("price"));
            String image = request.getParameter("image");
            int categoryId = Integer.parseInt(request.getParameter("categoryId"));
            int brandId = Integer.parseInt(request.getParameter("brandId"));
            boolean status = request.getParameter("status") != null;

            Products p = new Products();
            p.setName(name);
            p.setPrice(price);
            p.setImage(image);
            p.setId_category(categoryId);
            p.setId_brand(brandId); // Phải đảm bảo Products.java không còn lệnh throw
            p.setStatus(status);

            Database.getProductsDao().insert(p);
            response.sendRedirect(request.getContextPath() + "/admin");
        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect(request.getContextPath() + "/admin/product/add?error=1");
        }
    }
}