package controller;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.Products;
import model.Brand;

@WebServlet(name = "ProductDetailServlet", urlPatterns = {"/product-detail"})
public class ProductDetailServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String idParam = request.getParameter("id");
        if (idParam == null || idParam.isEmpty()) {
            response.sendRedirect("home");
            return;
        }

        try {
            int id = Integer.parseInt(idParam);
            Products product = Database.getProductsDao().findProducts(id);
            
            if (product != null) {
                String brandName = "Đang cập nhật";
                Brand brand = Database.getBrandDao().getBrandById(product.getId_brand());
                if (brand != null) {
                    brandName = brand.getName();
                }
                
                request.setAttribute("product", product);
                request.setAttribute("brandName", brandName);
                request.setAttribute("pageTitle", product.getName());
                
                // Cung cấp dữ liệu cho Navbar
                request.setAttribute("listCategory", Database.getCategoryDao().findAll());
                request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
                
                request.getRequestDispatcher("/views/product-detail.jsp").forward(request, response);
            } else {
                response.sendRedirect("home");
            }
        } catch (NumberFormatException e) {
            response.sendRedirect("home");
        }
    }
}
