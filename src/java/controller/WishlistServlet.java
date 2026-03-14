package controller;

import data.dao.Database;
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

@WebServlet(name = "WishlistServlet", urlPatterns = {"/wishlist"})
public class WishlistServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        String action = request.getParameter("action");
        String idParam = request.getParameter("id");

        // --- CHƯA ĐĂNG NHẬP MÀ BẤM YÊU THÍCH: Chuyển sang trang đăng nhập, sau login sẽ tự thêm SP ---
        if (session.getAttribute("user") == null && idParam != null && !idParam.isEmpty() && "add".equals(action)) {
            response.sendRedirect(request.getContextPath() + "/login?target_id=" + idParam);
            return;
        }

        // --- DANH SÁCH YÊU THÍCH TRONG SESSION (CHỈ KHI ĐÃ ĐĂNG NHẬP) ---
        List<Products> wishlist = (List<Products>) session.getAttribute("wishlist");
        if (wishlist == null) {
            wishlist = new ArrayList<>();
            session.setAttribute("wishlist", wishlist); // Sửa lỗi: đảm bảo set lại attribute nếu tạo mới
        }

        // --- XỬ LÝ THÊM / XÓA SẢN PHẨM NẾU CÓ THAM SỐ id ---
        if (idParam != null && !idParam.isEmpty()) {
            try {
                int id = Integer.parseInt(idParam);
                if ("add".equals(action)) {
                    Products p = Database.getProductsDao().findProducts(id);
                    if (p != null) {
                        boolean exists = false;
                        for (Products prod : wishlist) {
                            if (prod.getId() == id) {
                                exists = true;
                                break;
                            }
                        }
                        if (!exists) {
                            wishlist.add(p);
                        } else {
                            // Nếu đã tồn tại thì BỎ YÊU THÍCH (Toggle mode cho AJAX)
                            wishlist.removeIf(item -> item.getId() == id);
                        }
                    }
                } else if ("remove".equals(action)) {
                    wishlist.removeIf(item -> item.getId() == id);
                }
                // Sửa lỗi: phải set lại attribute sau khi thay đổi danh sách
                session.setAttribute("wishlist", wishlist);
            } catch (NumberFormatException e) {
                // Xử lý lỗi chuyển đổi ID: có thể ghi log ra file/console, ở đây chỉ in ra để debug
                e.printStackTrace();
            } catch (Exception ex) {
                // Bắt lỗi khác nếu có lỗi khi thao tác list
                ex.printStackTrace();
            }
        }

        // --- TRẢ VỀ KẾT QUẢ ---
        String ajax = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(ajax)) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            try {
                response.getWriter().write("{\"newSize\": " + wishlist.size() + "}");
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            request.setAttribute("listCategory", Database.getCategoryDao().findAll());
            request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
            request.getRequestDispatcher("/inc/wishlist.jsp").forward(request, response);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}