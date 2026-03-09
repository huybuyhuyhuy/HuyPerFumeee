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

        // 1. XỬ LÝ GIỎ HÀNG (Dùng target_id hoặc add_to_cart)
        String cartParam = request.getParameter("add_to_cart");
        if (cartParam != null && !cartParam.isEmpty()) {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                response.sendRedirect("login?target_id=" + cartParam);
                return; 
            }
            addProductsToCart(request);
            
            // Xóa tham số add_to_cart khỏi URL để tránh refresh trang bị thêm liên tục
            String currentQuery = request.getQueryString();
            String cleanQuery = (currentQuery != null) ? currentQuery.replace("add_to_cart=" + cartParam, "").replaceAll("&+", "&").replaceAll("^&|&$", "") : "";
            response.sendRedirect("home" + (cleanQuery.isEmpty() ? "" : "?" + cleanQuery));
            return; 
        }

        // 2. NHẬN THAM SỐ
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

        // 3. LOGIC LỌC (Cần đồng nhất phân trang cho cả Lọc)
        try {
            if (txtSearch != null && !txtSearch.isEmpty()) {
                productList = Database.getProductsDao().findByName(txtSearch);
                totalProducts = productList.size();
                pageTitle = "Kết quả cho: '" + txtSearch + "'";
            } 
            else if (categoryIdParam != null && !categoryIdParam.isEmpty()) {
                int categoryId = Integer.parseInt(categoryIdParam);
                productList = Database.getProductsDao().getProductsByCategoryId(categoryId);
                totalProducts = productList.size();
                pageTitle = "Danh mục sản phẩm";
            } 
            else if (brandIdParam != null && !brandIdParam.isEmpty()) {
                int brandId = Integer.parseInt(brandIdParam);
                // Ép kiểu sang ProductsImpl để gọi hàm Brand
                productList = ((ProductsImpl)Database.getProductsDao()).getProductsByBrandId(brandId);
                totalProducts = productList.size();
                pageTitle = "Thương hiệu sản phẩm";
            } 
            else {
                // Trang chủ mặc định có phân trang
                productList = Database.getProductsDao().findProductsByPage(offset, pageSize);
                totalProducts = Database.getProductsDao().countAllProducts();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        int totalPages = (int) Math.ceil((double) totalProducts / pageSize);

        // 4. CUNG CẤP DỮ LIỆU ĐỂ HIỂN THỊ SIDEBAR VÀ NAVBAR
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());

        // 5. ĐẨY DỮ LIỆU SẢN PHẨM
        request.setAttribute("listProducts", productList);
        request.setAttribute("pageTitle", pageTitle);
        request.setAttribute("totalPages", totalPages);
        request.setAttribute("currentPage", currentPage);

        // 6. THÔNG BÁO THANH TOÁN
        if ("success".equals(request.getParameter("checkout"))) {
            request.setAttribute("paymentMessage", "Bạn đã đặt hàng thành công!");
        }

        // 7. HIỂN THỊ
        request.getRequestDispatcher("/views/home.jsp").forward(request, response);
    }

    void addProductsToCart(HttpServletRequest request) {
        try {
            String productIdStr = request.getParameter("add_to_cart");
            if (productIdStr == null) return;
            
            int productId = Integer.parseInt(productIdStr);
            HttpSession session = request.getSession();
            List<Products> cart = (List<Products>) session.getAttribute("cart");
            if (cart == null) cart = new ArrayList<>();
            
            boolean exists = false;
            for (Products p : cart) {
                if (p.getId() == productId) {
                    p.setQuantity(p.getQuantity() + 1);
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                Products p = Database.getProductsDao().findProducts(productId);
                if (p != null) {
                    p.setQuantity(1);
                    cart.add(p);
                }
            }
            session.setAttribute("cart", cart);
        } catch (NumberFormatException e) {
            System.err.println("ID sản phẩm không hợp lệ");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}