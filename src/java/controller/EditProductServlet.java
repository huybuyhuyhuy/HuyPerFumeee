/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package controller;

import data.dao.Database;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.Products;

/**
 *
 * @author huyle
 */
@WebServlet(name = "EditProductServlet", urlPatterns = {"/admin/product/edit"})
public class EditProductServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        int id = Integer.parseInt(request.getParameter("id"));
        Products p = Database.getProductsDao().findProducts(id);
        request.setAttribute("product", p);
        request.getRequestDispatcher("/inc/edit-products.jsp").forward(request, response);
    }
    @Override
protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {
    request.setCharacterEncoding("UTF-8");
    try {
        String idStr = request.getParameter("id");
        String action = request.getParameter("action");
        System.out.println("Received request: action=" + action + ", id=" + idStr);

        if (idStr == null || idStr.isEmpty()) {
            throw new Exception("Missing product ID");
        }

        int id = Integer.parseInt(idStr);

        // Tham số "action" xác định form nào đã được gửi đi
        if ("toggle_status".equals(action)) {
            // Hành động này đến từ công tắc bật/tắt
            String statusStr = request.getParameter("status");
            System.out.println("Toggling status: status=" + statusStr);
            // Quan trọng: Nếu checkbox không được check, statusStr sẽ là null
            boolean newStatus = (statusStr != null && statusStr.equals("on"));
            Database.getProductsDao().updateStatus(id, newStatus);
        } else if ("update_stock".equals(action)) {
            // Hành động này đến từ form nhập số lượng tồn kho nhỏ
            String stockStr = request.getParameter("stock");
            System.out.println("Updating stock: stock=" + stockStr);
            if (stockStr != null && !stockStr.isEmpty()) {
                int newStock = Integer.parseInt(stockStr);
                Database.getProductsDao().setStock(id, newStock);
                // Nếu số lượng tồn kho được cập nhật lớn hơn 0, đảm bảo trạng thái là BẬT
                if (newStock > 0) {
                    Database.getProductsDao().updateStatus(id, true);
                }
            }
        } else {
            // Đây là hành động mặc định, dành cho trang chỉnh sửa đầy đủ (Edit Form)
            System.out.println("Full edit action");
            Products p = Database.getProductsDao().findProducts(id);
            if (p == null) throw new Exception("Sản phẩm không tồn tại");

            String name = request.getParameter("name");
            if (name != null) p.setName(name);

            String priceStr = request.getParameter("price");
            if (priceStr != null) p.setPrice(Double.parseDouble(priceStr));

            String discountPriceStr = request.getParameter("discount_price");
            if (discountPriceStr != null && !discountPriceStr.isEmpty()) {
                p.setDiscount_price(Double.parseDouble(discountPriceStr));
            } else {
                p.setDiscount_price(0);
            }

            String image = request.getParameter("image");
            if (image != null) p.setImage(image);

            String catIdStr = request.getParameter("categoryId");
            if (catIdStr != null) p.setId_category(Integer.parseInt(catIdStr));

            String brandIdStr = request.getParameter("brandId");
            if (brandIdStr != null) p.setId_brand(Integer.parseInt(brandIdStr));

            String stockStr = request.getParameter("stock");
            if (stockStr != null) p.setStock(Integer.parseInt(stockStr));

            String statusStr = request.getParameter("status");
            // Đối với form đầy đủ, checkbox 'status' không được gửi đi có nghĩa là 'off'
            p.setStatus(statusStr != null && statusStr.equals("on"));

            // Lưu đối tượng sản phẩm đã cập nhật vào cơ sở dữ liệu
            boolean success = Database.getProductsDao().update(p);
            System.out.println("Full update success: " + success);
        }

        // Chuyển hướng trở lại trang quản trị
        response.sendRedirect(request.getContextPath() + "/admin");

    } catch (Exception e) {
        System.err.println("Error in EditProductServlet: " + e.getMessage());
        e.printStackTrace();
        // Chuyển hướng với một cờ lỗi để phản hồi cho người dùng
        response.sendRedirect(request.getContextPath() + "/admin?error=update_failed");
    }
}
}
