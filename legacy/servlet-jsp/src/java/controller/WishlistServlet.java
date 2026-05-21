package controller;

import data.dao.Database;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import model.Products;
import model.User;

@WebServlet(name = "WishlistServlet", urlPatterns = {"/wishlist"})
public class WishlistServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        String action = request.getParameter("action");
        String idParam = request.getParameter("id");

        if (user == null) {
            if (idParam != null && !idParam.isEmpty() && "add".equals(action)) {
                response.sendRedirect(request.getContextPath() + "/login?target_id=" + idParam);
                return;
            }
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        int userId = user.getId();
        if (idParam != null && !idParam.isEmpty()) {
            try {
                int id = Integer.parseInt(idParam);
                if ("add".equals(action)) {
                    Products p = Database.getProductsDao().findProducts(id);
                    if (p != null) {
                        if (Database.getWishlistDao().exists(userId, id)) {
                            Database.getWishlistDao().remove(userId, id);
                        } else {
                            Database.getWishlistDao().add(userId, id);
                        }
                    }
                } else if ("remove".equals(action)) {
                    Database.getWishlistDao().remove(userId, id);
                }
            } catch (NumberFormatException e) {
                getServletContext().log("Invalid wishlist product id", e);
            } catch (Exception ex) {
                getServletContext().log("Error while updating wishlist", ex);
            }
        }

        List<Products> wishlist = Database.getWishlistDao().getWishlistProducts(userId);
        int count = wishlist.size();
        session.setAttribute("wishlist", wishlist);
        session.setAttribute("wishlistCount", count);

        String ajax = request.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(ajax)) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            try {
                response.getWriter().write("{\"newSize\": " + count + "}");
            } catch (IOException e) {
                getServletContext().log("Error writing wishlist ajax response", e);
            }
        } else {
            request.setAttribute("wishlistItems", wishlist);
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