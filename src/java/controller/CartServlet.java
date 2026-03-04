package controller;

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

@WebServlet(name = "CartServlet", urlPatterns = {"/cart"})
public class CartServlet extends HttpServlet {

    @Override
    //Nhận tham số và hiển thị 
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Xử lý Clear giỏ hàng
        if (request.getParameter("clear") != null) {
            request.getSession().setAttribute("cart", new ArrayList<Products>());
        }
        
        request.setAttribute("title", "Cart Detail");
        // Nên dùng forward để hiển thị trang giỏ hàng
       request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
    }
        // đưa dữ liệu lên và xử lí
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        updateDelete(request, response);
    }
    
    void updateDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String action = request.getParameter("action");
        String idParam = request.getParameter("id_product");
        
        if (action != null && idParam != null) {
            int id_product = Integer.parseInt(idParam);
            switch (action) {
                case "update":
                    doUpdate(request, id_product);
                    break;
                case "delete":
                    doDelete(request, id_product);
                    break;
            }
        }
        
        response.sendRedirect("cart");
    }
    
    void doUpdate(HttpServletRequest request, int id_product) {
        HttpSession session = request.getSession();
        List<Products> cart = (List<Products>) session.getAttribute("cart");
        
        if (cart != null) {
            String qParam = request.getParameter("quantity");
            if (qParam != null) {
                int quantity = Integer.parseInt(qParam);
                for (Products pro : cart) {
                    if (pro.getId() == id_product) {
                        if (quantity > 0) {
                            pro.setQuantity(quantity);
                        }
                        break;
                    }
                }
                session.setAttribute("cart", cart);
            }
        }
    }

    void doDelete(HttpServletRequest request, int id_product) {
        HttpSession session = request.getSession();
        List<Products> cart = (List<Products>) session.getAttribute("cart");
        
        if (cart != null) {
            
            cart.removeIf(pro -> pro.getId() == id_product);
            session.setAttribute("cart", cart);
        }
    }
}