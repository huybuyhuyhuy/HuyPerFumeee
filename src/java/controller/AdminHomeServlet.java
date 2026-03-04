package controller;

import data.dao.Database;
import model.Products;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@WebServlet(name = "AdminHomeServlet", urlPatterns = {"/admin"})
public class AdminHomeServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Lấy tham số lọc từ URL
        String catIdRaw = request.getParameter("categoryId");
        String brandIdRaw = request.getParameter("brandId");
        
        List<Products> list;

        // 2. Logic lọc sản phẩm đồng bộ
        if (catIdRaw != null && !catIdRaw.isEmpty()) {
            int catId = Integer.parseInt(catIdRaw);
            list = Database.getProductsDao().getProductsByCategoryId(catId);
        } else if (brandIdRaw != null && !brandIdRaw.isEmpty()) {
            int brandId = Integer.parseInt(brandIdRaw);
            // Ép kiểu để gọi hàm lấy theo Brand ID đơn lẻ
            list = ((data.impl.ProductsImpl)Database.getProductsDao()).getProductsByBrandId(brandId);
        } else {
            list = Database.getProductsDao().findAll();
        }

        // 3. Đưa tất cả dữ liệu cần thiết sang JSP
        request.setAttribute("listCategories", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands()); // CẬP NHẬT DÒNG NÀY
        request.setAttribute("listProducts", list);
        request.setAttribute("title", "Quản lý sản phẩm");
        
        request.getRequestDispatcher("/inc/_admin.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}