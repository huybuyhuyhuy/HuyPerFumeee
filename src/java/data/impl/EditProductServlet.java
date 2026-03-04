/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package data.impl;

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
        // Lấy ID từ hidden field
        String idRaw = request.getParameter("id");
        if (idRaw == null || idRaw.isEmpty()) {
            throw new Exception("Không tìm thấy ID sản phẩm");
        }
        int id = Integer.parseInt(idRaw);
        
        // Tạo đối tượng Products và gán giá trị
        Products p = new Products();
        p.setId(id);
        p.setName(request.getParameter("name"));
        p.setPrice(Double.parseDouble(request.getParameter("price")));
        p.setImage(request.getParameter("image"));
        p.setId_category(Integer.parseInt(request.getParameter("categoryId")));
        p.setId_brand(Integer.parseInt(request.getParameter("brandId")));
        p.setStatus(request.getParameter("status") != null);

        // Gọi hàm UPDATE chuẩn từ ProductsImpl
        Database.getProductsDao().update(p); 
        
        response.sendRedirect(request.getContextPath() + "/admin");
    } catch (Exception e) {
        e.printStackTrace();
        response.sendRedirect(request.getContextPath() + "/admin?error=update_failed");
        }
    }
}
