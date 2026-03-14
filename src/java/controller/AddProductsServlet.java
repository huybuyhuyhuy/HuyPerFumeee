package controller;

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
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.getRequestDispatcher("/inc/add-products.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        try {
            String name = request.getParameter("name");
            double price = Double.parseDouble(request.getParameter("price"));
            double discountPrice = 0;
            String discountPriceStr = request.getParameter("discount_price");
            if (discountPriceStr != null && !discountPriceStr.isEmpty()) {
                discountPrice = Double.parseDouble(discountPriceStr);
            }
            String image = request.getParameter("image");
            int categoryId = Integer.parseInt(request.getParameter("categoryId"));
            int brandId = Integer.parseInt(request.getParameter("brandId"));
            int stock = Integer.parseInt(request.getParameter("stock"));
            boolean status = request.getParameter("status") != null;

            Products p = new Products();
            p.setName(name);
            p.setPrice(price);
            p.setDiscount_price(discountPrice);
            p.setImage(image);
            p.setId_category(categoryId);
            p.setId_brand(brandId);
            p.setStock(stock);
            p.setStatus(status);

            Database.getProductsDao().insert(p);
            response.sendRedirect(request.getContextPath() + "/admin");
        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect(request.getContextPath() + "/admin/product/add?error=1");
        }
    }
}