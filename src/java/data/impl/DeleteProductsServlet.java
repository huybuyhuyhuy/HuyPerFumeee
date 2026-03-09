package data.impl;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * @author huyle
 */

@WebServlet(name = "DeleteProductsServlet", urlPatterns = {"/admin/product/delete"})
public class DeleteProductsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            // 1. Lấy ID sản phẩm từ tham số truyền vào URL (ví dụ: delete?id=64)
            String idRaw = request.getParameter("id");
            
            if (idRaw != null && !idRaw.isEmpty()) {
                int id = Integer.parseInt(idRaw);
                
                // 2. Gọi hàm delete đã viết trong ProductsImpl thông qua Database
                Database.getProductsDao().delete(id);
            }
            
            // 3. Xóa xong quay trở lại trang danh sách admin
            response.sendRedirect(request.getContextPath() + "/admin");
            
        } catch (Exception e) {
            e.printStackTrace();
            // Nếu có lỗi, vẫn quay về trang admin nhưng kèm thông báo lỗi
            response.sendRedirect(request.getContextPath() + "/admin?error=delete_failed");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Chức năng xóa thường dùng GET, nếu form gửi POST thì gọi sang doGet
        doGet(request, response);
    }
}