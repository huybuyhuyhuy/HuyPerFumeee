package data.utils;

import data.dao.Database;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import model.Products;

public class CartUtils {

    public static void addProductsToCart(HttpServletRequest request) {
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
            e.printStackTrace();
        }
    }
}
