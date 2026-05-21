package controller;

import data.dao.Database;
import data.utils.CartUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import model.Products;
import model.User;

@WebServlet(name = "AllProductsServlet", urlPatterns = {"/all-products"})
public class AllProductsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession();

        // Xử lý thêm giỏ hàng
        String cartParam = request.getParameter("add_to_cart");
        if (cartParam != null && !cartParam.isEmpty()) {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                response.sendRedirect("login?target_id=" + cartParam);
                return;
            }
            CartUtils.addProductsToCart(request);
            response.sendRedirect("all-products?cart=added");
            return;
        }

        // Phân trang
        int pageSize = 16;
        int currentPage = 1;
        String pageStr = request.getParameter("page");
        if (pageStr != null && !pageStr.isEmpty()) {
            try { currentPage = Integer.parseInt(pageStr); } catch (Exception e) { currentPage = 1; }
        }
        int offset = (currentPage - 1) * pageSize;

        // Sort
        String sortParam = request.getParameter("sort");
        if (sortParam == null || sortParam.isEmpty()) sortParam = "newest";

        // Lấy toàn bộ sản phẩm (không lọc category)
        List<Products> allProducts = Database.getProductsDao().findProductsByPage(offset, pageSize, sortParam);
        int totalProducts = Database.getProductsDao().countAllProducts();
        int totalPages = (int) Math.ceil((double) totalProducts / pageSize);

        allProducts = applySort(allProducts, sortParam);

        // Navbar data
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());

        request.setAttribute("listProducts", allProducts);
        request.setAttribute("totalPages", totalPages);
        request.setAttribute("currentPage", currentPage);
        request.setAttribute("sort", sortParam);
        request.setAttribute("totalProducts", totalProducts);

        request.getRequestDispatcher("/views/all-products.jsp").forward(request, response);
    }

    private List<Products> applySort(List<Products> products, String sort) {
        if (products == null || products.isEmpty() || sort == null) return products;
        Comparator<Products> comparator;
        switch (sort) {
            case "price_asc":
                comparator = Comparator.comparingDouble(p -> p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice());
                break;
            case "price_desc":
                comparator = Comparator.comparingDouble((Products p) -> p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice()).reversed();
                break;
            case "newest":
            default:
                comparator = Comparator.comparingInt(Products::getId).reversed();
                break;
        }
        products.sort(comparator);
        return products;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}
