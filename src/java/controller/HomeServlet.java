package controller;

import data.dao.Database;
import data.impl.ProductsImpl;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import model.Products;
import model.User;

@WebServlet(name = "HomeServlet", urlPatterns = {"/home"})
public class HomeServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        HttpSession session = request.getSession();

        // 1. XỬ LÝ GIỎ HÀNG
        String cartParam = request.getParameter("add_to_cart");
        if (cartParam != null && !cartParam.isEmpty()) {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                // Lưu lại ID sản phẩm để sau khi login có thể thêm tiếp
                response.sendRedirect("login?target_id=" + cartParam);
                return; 
            }
            addProductsToCart(request);
            // Sau khi thêm giỏ hàng, quay lại đúng trang và bộ lọc hiện tại
            String redirectUrl = "home?" + (request.getQueryString() != null ? request.getQueryString().replace("add_to_cart=" + cartParam, "") : "");
            response.sendRedirect(redirectUrl.endsWith("?") ? "home" : redirectUrl);
            return; 
        }

        // 2. NHẬN THAM SỐ PHÂN TRANG & LỌC
        int pageSize = 12; 
        int currentPage = 1;
        String pageStr = request.getParameter("page");
        if (pageStr != null && !pageStr.isEmpty()) {
            try { currentPage = Integer.parseInt(pageStr); } catch (Exception e) { currentPage = 1; }
        }
        int offset = (currentPage - 1) * pageSize;

        String txtSearch = request.getParameter("txtSearch");
        String categoryIdParam = request.getParameter("id_category");
        String brandIdParam = request.getParameter("brand_id");

        List<Products> productList = new ArrayList<>();
        int totalProducts = 0;
        String pageTitle = "Tất cả Sản phẩm";

        // 3. LOGIC LỌC KẾT HỢP PHÂN TRANG
        if (txtSearch != null && !txtSearch.isEmpty()) {
            productList = Database.getProductsDao().findByName(txtSearch);
            totalProducts = productList.size();
            pageTitle = "Kết quả cho: '" + txtSearch + "'";
            request.setAttribute("txtSearch", txtSearch);
        } 
        else if (categoryIdParam != null && !categoryIdParam.isEmpty()) {
            int categoryId = Integer.parseInt(categoryIdParam);
            productList = Database.getProductsDao().getProductsByCategoryId(categoryId);
            totalProducts = productList.size();
            pageTitle = "Danh mục sản phẩm";
            request.setAttribute("id_category", categoryId);
        } 
        else if (brandIdParam != null && !brandIdParam.isEmpty()) {
            int brandId = Integer.parseInt(brandIdParam);
            // Đảm bảo ProductsImpl đã được import
            productList = ((ProductsImpl)Database.getProductsDao()).getProductsByBrandId(brandId);
            totalProducts = productList.size();
            pageTitle = "Thương hiệu sản phẩm";
            request.setAttribute("brand_id", brandId);
        } 
        else {
            productList = Database.getProductsDao().findProductsByPage(offset, pageSize);
            totalProducts = Database.getProductsDao().countAllProducts();
        }

        int totalPages = (int) Math.ceil((double) totalProducts / pageSize);

        // 4. QUAN TRỌNG: LUÔN CUNG CẤP DỮ LIỆU CHO NAVBAR 
        
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());

        // 5. ĐẨY DỮ LIỆU HIỂN THỊ SẢN PHẨM
        request.setAttribute("listProducts", productList);
        request.setAttribute("pageTitle", pageTitle);
        request.setAttribute("totalPages", totalPages);
        request.setAttribute("currentPage", currentPage);
           //6.
           // Trong HomeServlet.java
            String checkoutStatus = request.getParameter("checkout");
            if ("success".equals(checkoutStatus)) {
                request.setAttribute("paymentMessage", "Bạn đã đặt hàng và thanh toán thành công!");
            }
        // 7.. HIỂN THỊ (Đảm bảo file home.jsp nằm đúng thư mục /views/)
        request.getRequestDispatcher("/views/home.jsp").forward(request, response);
    }

    void addProductsToCart(HttpServletRequest request) {
        try {
            String cartParam = request.getParameter("add_to_cart");
            if (cartParam == null || cartParam.isEmpty()) {
                cartParam = request.getParameter("target_id");
            }
            if (cartParam == null || cartParam.isEmpty()) return;
            
            int id_products = Integer.parseInt(cartParam);
            HttpSession session = request.getSession();
            List<Products> cart = (List<Products>) session.getAttribute("cart");
            if (cart == null) cart = new ArrayList<>();
            
            boolean isProductInCart = false;
            for (Products pro : cart) {
                if (pro.getId() == id_products) {
                    pro.setQuantity(pro.getQuantity() + 1);
                    isProductInCart = true;
                    break;
                }
            }
            if (!isProductInCart) {
                Products products = Database.getProductsDao().findProducts(id_products);
                if (products != null) {
                    products.setQuantity(1);
                    cart.add(products);
                }
            }
            session.setAttribute("cart", cart);
        } catch (Exception e) {
            System.err.println("Lỗi thêm giỏ hàng: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}