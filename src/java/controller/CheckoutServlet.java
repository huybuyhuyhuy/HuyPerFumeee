package controller;

<<<<<<< HEAD
import data.driver.MySQLDriver;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
=======
import java.io.IOException;
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
<<<<<<< HEAD
import model.Products;
import model.User;
=======
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870

@WebServlet(name = "CheckoutServlet", urlPatterns = {"/checkout"})
public class CheckoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
<<<<<<< HEAD

        HttpSession session = request.getSession();
        List<Products> cart = (List<Products>) session.getAttribute("cart");

        // 1. Kiểm tra giỏ hàng có tồn tại và có sản phẩm không
        if (cart == null || cart.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/home");
            return;
        }

        // 2. Lấy phương thức thanh toán
        String paymentMethod = request.getParameter("paymentMethod");

        // 3. Lấy thông tin user (có thể cho phép null nếu cho đặt hàng không đăng nhập)
        User user = (User) session.getAttribute("user");
        int userId = (user != null) ? user.getId() : 0;

        // 4. Tính tổng tiền đơn hàng
        double total = 0;
        for (Products p : cart) {
            total += p.getPrice() * p.getQuantity();
        }

        // 5. Lưu đơn hàng vào CSDL: bảng orders và order_items
        //  - orders(id, user_id, total, payment_method, created_at ...)
        //  - order_items(id, order_id, product_id, quantity, price)
        int orderId = 0;
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                throw new ServletException("Không kết nối được tới database");
            }
            try {
                con.setAutoCommit(false);

                // Insert vào bảng orders
                String sqlOrder = "INSERT INTO orders (user_id, total, payment_method) VALUES (?, ?, ?)";
                try (PreparedStatement ps = con.prepareStatement(sqlOrder, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, userId);
                    ps.setDouble(2, total);
                    ps.setString(3, paymentMethod);
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            orderId = rs.getInt(1);
                        }
                    }
                }

                // Insert các dòng chi tiết vào order_items
                String sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                try (PreparedStatement psItem = con.prepareStatement(sqlItem)) {
                    for (Products p : cart) {
                        psItem.setInt(1, orderId);
                        psItem.setInt(2, p.getId());
                        psItem.setInt(3, p.getQuantity());
                        psItem.setDouble(4, p.getPrice());
                        psItem.addBatch();
                    }
                    psItem.executeBatch();
                }

                con.commit();
            } catch (SQLException ex) {
                try {
                    con.rollback();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
                throw new ServletException(ex);
            } finally {
                try {
                    con.setAutoCommit(true);
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }

        // 6. XÓA GIỎ HÀNG SAU KHI THANH TOÁN XONG
        session.removeAttribute("cart");

        // 7. Chuyển hướng sang trang thành công
        request.setAttribute("paymentMethod", paymentMethod);
        request.getRequestDispatcher("/inc/success.jsp").forward(request, response);
=======
        
        HttpSession session = request.getSession();
        
        // 1. Kiểm tra giỏ hàng có tồn tại không
        if (session.getAttribute("cart") != null) {
            
            // 2. Lấy phương thức thanh toán
            String paymentMethod = request.getParameter("paymentMethod");
            
            // Ở ĐÂY: Bạn sẽ gọi OrderDAO để lưu đơn hàng vào Database
            // Ví dụ: orderDao.insertOrder(user, cart, paymentMethod);

            // 3. XÓA GIỎ HÀNG SAU KHI THANH TOÁN XONG
            session.removeAttribute("cart");
            
            // 4. Chuyển hướng sang trang thành công
         request.getRequestDispatcher("inc/success.jsp").forward(request, response);
        } else {
            // Nếu giỏ hàng trống mà truy cập checkout, đẩy về trang chủ
            response.sendRedirect(request.getContextPath() + "/home");
        }
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
<<<<<<< HEAD
        
=======
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
        response.sendRedirect(request.getContextPath() + "/home");
    }
}