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
        if (cartParam == null || cartParam.isEmpty()) {
            cartParam = request.getParameter("target_id");
        }
        
        if (cartParam != null && !cartParam.isEmpty()) {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                // Lưu lại ID sản phẩm để sau khi login có thể thêm tiếp
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
        String priceRangeParam = request.getParameter("price_range");

        List<Products> productList = new ArrayList<>();
        int totalProducts = 0;
        String pageTitle = "Tất cả Sản phẩm";

        // 3. LOGIC LỌC KẾT HỢP PHÂN TRANG
        try {
            if (txtSearch != null && !txtSearch.isEmpty()) {
                productList = Database.getProductsDao().findByName(txtSearch);
                totalProducts = productList.size();
                pageTitle = "Kết quả cho: '" + txtSearch + "'";
                request.setAttribute("txtSearch", txtSearch);
            } 
            else if (categoryIdParam != null && !categoryIdParam.isEmpty() && brandIdParam != null && !brandIdParam.isEmpty()) {
                // Lọc theo cả danh mục và thương hiệu
                int categoryId = Integer.parseInt(categoryIdParam);
                int brandId = Integer.parseInt(brandIdParam);
                productList = filterByCategoryAndBrand(categoryId, brandId);
                totalProducts = productList.size();
                pageTitle = "Kết quả lọc";
                request.setAttribute("id_category", categoryId);
                request.setAttribute("brand_id", brandId);
            }
            else if (categoryIdParam != null && !categoryIdParam.isEmpty()) {
                int categoryId = Integer.parseInt(categoryIdParam);
                productList = Database.getProductsDao().getProductsByCategoryId(categoryId);
                totalProducts = productList.size();
                
                // Cập nhật Page Title theo danh mục
                if (categoryId == 5) pageTitle = "Nước hoa chiết";
                else pageTitle = "Danh mục sản phẩm";
                
                request.setAttribute("id_category", categoryId);
            } 
            else if (brandIdParam != null && !brandIdParam.isEmpty()) {
                int brandId = Integer.parseInt(brandIdParam);
                productList = Database.getProductsDao().getProductsByBrandId(brandId);
                totalProducts = productList.size();
                pageTitle = "Thương hiệu sản phẩm";
                request.setAttribute("brand_id", brandId);
            } 
            else if (priceRangeParam != null && !priceRangeParam.isEmpty()) {
                productList = filterByPrice(priceRangeParam);
                totalProducts = productList.size();
                pageTitle = "Lọc theo giá";
                request.setAttribute("price_range", priceRangeParam);
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

        // 4. QUAN TRỌNG: LUÔN CUNG CẤP DỮ LIỆU CHO NAVBAR 
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());

        // 5. ĐẨY DỮ LIỆU HIỂN THỊ SẢN PHẨM
        request.setAttribute("listProducts", productList);
        request.setAttribute("pageTitle", pageTitle);
        request.setAttribute("totalPages", totalPages);
        request.setAttribute("currentPage", currentPage);

        // 6. THÔNG BÁO THANH TOÁN
        String checkoutStatus = request.getParameter("checkout");
        if ("success".equals(checkoutStatus)) {
            request.setAttribute("paymentMessage", "Bạn đã đặt hàng và thanh toán thành công!");
        }

        // 7. HIỂN THỊ (Đảm bảo file home.jsp nằm đúng thư mục /views/)
        request.getRequestDispatcher("/views/home.jsp").forward(request, response);
    }

    private List<Products> filterByCategoryAndBrand(int categoryId, int brandId) {
        List<Products> all = Database.getProductsDao().findAll();
        List<Products> filtered = new ArrayList<>();
        for (Products p : all) {
            if (p.isStatus() && p.getId_category() == categoryId && p.getId_brand() == brandId) {
                filtered.add(p);
            }
        }
        return filtered;
    }

    private List<Products> filterByPrice(String range) {
        List<Products> all = Database.getProductsDao().findAll();
        List<Products> filtered = new ArrayList<>();
        for (Products p : all) {
            if (!p.isStatus()) continue;
            double price = p.getPrice();
            switch (range) {
                case "under500":
                    if (price < 500000) filtered.add(p);
                    break;
                case "500to1000":
                    if (price >= 500000 && price <= 1000000) filtered.add(p);
                    break;
                case "1000to2000":
                    if (price >= 1000000 && price <= 2000000) filtered.add(p);
                    break;
                case "above2000":
                    if (price > 2000000) filtered.add(p);
                    break;
            }
        }
        return filtered;
    }

    void addProductsToCart(HttpServletRequest request) {
        try {
            String cartParam = request.getParameter("add_to_cart");
            if (cartParam == null || cartParam.isEmpty()) {
                cartParam = request.getParameter("target_id");
            }
            if (cartParam == null || cartParam.isEmpty()) return;
            
            int productId = Integer.parseInt(cartParam);
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
