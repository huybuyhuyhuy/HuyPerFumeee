package controller;

import data.driver.MySQLDriver;
import data.utils.MomoConfig;
import data.utils.MomoNodeClient;
import data.utils.MomoPaymentHelper;
import java.io.IOException;
import java.net.ConnectException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import model.Products;
import model.User;

@WebServlet(name = "CheckoutServlet", urlPatterns = {"/checkout"})
public class CheckoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        List<Products> cart = (List<Products>) session.getAttribute("cart");

        if (cart == null || cart.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/home");
            return;
        }

        String paymentMethod = request.getParameter("paymentMethod");
        User user = (User) session.getAttribute("user");
        int userId = (user != null) ? user.getId() : 0;

        double total = 0;
        for (Products p : cart) {
            double actualPrice = (p.getDiscount_price() > 0) ? p.getDiscount_price() : p.getPrice();
            total += actualPrice * p.getQuantity();
        }

        try (Connection con = MySQLDriver.getConnection()) {
            con.setAutoCommit(false);
            try {
                // 1. Insert Order
                int orderId = 0;
                String sqlOrder = "INSERT INTO orders (user_id, total, payment_method, status, created_at) VALUES (?, ?, ?, ?, NOW())";
                try (PreparedStatement ps = con.prepareStatement(sqlOrder, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, userId);
                    ps.setDouble(2, total);
                    ps.setString(3, paymentMethod);
                    ps.setString(4, "Chờ xác nhận");
                    ps.executeUpdate();
                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) orderId = rs.getInt(1);
                    }
                }

                // 2. Insert Items & Update Stock
                String sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                try (PreparedStatement psItem = con.prepareStatement(sqlItem)) {
                    for (Products p : cart) {
                        psItem.setInt(1, orderId);
                        psItem.setInt(2, p.getId());
                        psItem.setInt(3, p.getQuantity());
                        double actualPrice = (p.getDiscount_price() > 0) ? p.getDiscount_price() : p.getPrice();
                        psItem.setDouble(4, actualPrice);
                        psItem.addBatch();
                        
                        // Sử dụng DAO để cập nhật kho (nhưng trong cùng transaction thì dùng con này luôn cho an toàn)
                        // Tuy nhiên yêu cầu là dùng logic trừ kho, tôi sẽ dùng SQL trực tiếp ở đây để đảm bảo Transaction Atomicity
                        String sqlUpdateStock = "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?";
                        try (PreparedStatement psStock = con.prepareStatement(sqlUpdateStock)) {
                            psStock.setInt(1, p.getQuantity());
                            psStock.setInt(2, p.getId());
                            psStock.setInt(3, p.getQuantity());
                            int updated = psStock.executeUpdate();
                            if (updated == 0) {
                                throw new SQLException("Sản phẩm " + p.getName() + " đã hết hàng!");
                            }
                        }
                    }
                    psItem.executeBatch();
                }

                con.commit();
                session.removeAttribute("cart");

                // --- MoMo: chuyển sang cổng thanh toán (API create – giống demo Node, không cần chạy Node) ---
                if ("Momo".equals(paymentMethod)) {
                    long amountVnd = Math.round(total);
                    if (amountVnd < MomoConfig.MIN_AMOUNT_VND) {
                        amountVnd = MomoConfig.MIN_AMOUNT_VND;
                    }
                    String momoOrderId = MomoConfig.PARTNER_CODE + System.currentTimeMillis();
                    String orderInfo = "Thanh toan don hang #" + orderId;
                    String base = request.getScheme() + "://" + request.getServerName()
                            + ":" + request.getServerPort() + request.getContextPath();
                    String redirectUrl = base + "/momo-return";
                    String ipnUrl = base + "/momo-ipn";

                    session.setAttribute("MOMO_PENDING_ORDER_ID", orderId);
                    session.setAttribute("MOMO_PENDING_MOMO_ORDER_ID", momoOrderId);

                    try {
                        String payUrl = createMomoPayUrl(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
                        response.sendRedirect(payUrl);
                        return;
                    } catch (Exception ex) {
                        request.setAttribute("errorMsg", "Không tạo được link MoMo: " + ex.getMessage());
                        request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
                        return;
                    }
                }

                request.setAttribute("paymentMethod", paymentMethod);
                request.getRequestDispatcher("/inc/success.jsp").forward(request, response);

            } catch (Exception ex) {
                con.rollback();
                request.setAttribute("errorMsg", ex.getMessage());
                request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
            } finally {
                con.setAutoCommit(true);
            }
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }

    /**
     * Tạo link thanh toán MoMo: nếu bật Node mà chưa chạy (Connection refused) → gọi trực tiếp API từ Java.
     */
    private String createMomoPayUrl(long amountVnd, String momoOrderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {
        if (!MomoConfig.USE_NODE_PROXY) {
            return MomoPaymentHelper.createPayment(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
        }
        try {
            return MomoNodeClient.createPayment(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
        } catch (Exception e) {
            if (isConnectionRefused(e)) {
                System.err.println("[MoMo] Node không chạy (" + MomoConfig.NODE_PAYMENT_URL + "), dùng Java gọi trực tiếp MoMo.");
                return MomoPaymentHelper.createPayment(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
            }
            throw e;
        }
    }

    private static boolean isConnectionRefused(Throwable t) {
        while (t != null) {
            if (t instanceof ConnectException) {
                return true;
            }
            String msg = t.getMessage();
            if (msg != null && (msg.contains("Connection refused") || msg.contains("refused"))) {
                return true;
            }
            t = t.getCause();
        }
        return false;
    }
}
