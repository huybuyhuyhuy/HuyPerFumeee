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
                request.setAttribute("scentStructure", buildScentStructure(product));
                
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

    private String[] buildScentStructure(Products product) {
        String rawNotes = product.getScent_notes();
        if (rawNotes != null && !rawNotes.trim().isEmpty()) {
            String[] parts = rawNotes.split("\\|");
            if (parts.length >= 3) {
                return new String[]{parts[0].trim(), parts[1].trim(), parts[2].trim()};
            }
        }

        String[][] presets = new String[][]{
            {"Cam Bergamot, Quyt xanh, Tieu hong", "Hoa oai huong, Hoa phong lu, Nhu huong", "Go tuyet tung, Xa huong trang, Ho phach"},
            {"Chanh vang, Tao xanh, Bach dau khau", "Hoa hong, Nhan trang, Hoa cam", "Go dan huong, Vanilla, Vetiver"},
            {"Buoi chum, Qua le, La tim", "Hoa mau don, Lily, Hoa sua", "Patchouli, Amber, Xa huong"},
            {"Bach qua, Tieu den, Mandarin", "Iris, Geranium, Hoa linh lan", "Tonka bean, Oud nhe, Go guaiac"}
        };
        int idx = Math.abs(product.getId()) % presets.length;
        return presets[idx];
    }
}
