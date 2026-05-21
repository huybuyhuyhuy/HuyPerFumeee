package controller;

import data.driver.MySQLDriver;
import data.utils.MomoConfig;
import data.utils.MomoNodeClient;
import data.utils.MomoPaymentHelper;
import data.utils.ZaloPayPaymentHelper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.ConnectException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
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

        User user = (User) session.getAttribute("user");
        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        String paymentMethod = request.getParameter("paymentMethod");
        String shippingAddress = request.getParameter("shipping_address");
        String shippingPhone = request.getParameter("phone");

        if ((shippingAddress == null || shippingAddress.trim().isEmpty())) {
            shippingAddress = user.getAddress();
        }
        if ((shippingPhone == null || shippingPhone.trim().isEmpty())) {
            shippingPhone = user.getPhone();
        }

        double total = calculateTotal(cart);
        int orderId = 0;
        String momoOrderId = null;

        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) {
                throw new ServletException("Cannot connect to database");
            }

            con.setAutoCommit(false);
            try {
                orderId = insertOrder(con, user.getId(), total, shippingAddress, shippingPhone, paymentMethod);

                if ("Momo".equalsIgnoreCase(paymentMethod)) {
                    momoOrderId = MomoConfig.PARTNER_CODE + System.currentTimeMillis();
                    updateMomoOrderId(con, orderId, momoOrderId);
                }

                insertItemsAndUpdateStock(con, orderId, cart);
                con.commit();
            } catch (Exception ex) {
                con.rollback();
                request.setAttribute("errorMsg", ex.getMessage());
                request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
                return;
            } finally {
                con.setAutoCommit(true);
            }
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }

        List<Products> purchasedItems = new ArrayList<>(cart);
        session.removeAttribute("cart");

        if ("Momo".equalsIgnoreCase(paymentMethod)) {
            redirectToMomo(request, response, session, orderId, total, momoOrderId);
            return;
        }

        if ("ZaloPay".equalsIgnoreCase(paymentMethod)) {
            redirectToZaloPay(request, response, session, user, orderId, total);
            return;
        }

        request.setAttribute("paymentMethod", paymentMethod);
        request.setAttribute("orderId", orderId);
        request.setAttribute("orderTotal", total);
        request.setAttribute("receiptItems", purchasedItems);
        request.getRequestDispatcher("/inc/success.jsp").forward(request, response);
    }

    private double calculateTotal(List<Products> cart) {
        double total = 0;
        for (Products p : cart) {
            double actualPrice = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
            total += actualPrice * p.getQuantity();
        }
        return total;
    }

    private int insertOrder(Connection con, int userId, double total, String address, String phone, String paymentMethod)
            throws SQLException {
        String sql = "INSERT INTO orders (user_id, total, shipping_address, phone, payment_method, status, created_at) "
                + "VALUES (?, ?, ?, ?, ?, ?, GETDATE())";
        try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setDouble(2, total);
            ps.setString(3, address);
            ps.setString(4, phone);
            ps.setString(5, paymentMethod);
            ps.setString(6, "Waiting");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        throw new SQLException("Cannot create order");
    }

    private void updateMomoOrderId(Connection con, int orderId, String momoOrderId) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("UPDATE orders SET momo_order_id = ? WHERE id = ?")) {
            ps.setString(1, momoOrderId);
            ps.setInt(2, orderId);
            ps.executeUpdate();
        }
    }

    private void insertItemsAndUpdateStock(Connection con, int orderId, List<Products> cart) throws SQLException {
        String sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price, selected_batch_code, price_at_purchase, status) "
                + "VALUES (?, ?, ?, ?, ?, ?, 'Normal')";
        try (PreparedStatement psItem = con.prepareStatement(sqlItem)) {
            for (Products p : cart) {
                double actualPrice = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                psItem.setInt(1, orderId);
                psItem.setInt(2, p.getId());
                psItem.setInt(3, p.getQuantity());
                psItem.setDouble(4, actualPrice);
                psItem.setString(5, p.getBatch_code());
                psItem.setDouble(6, actualPrice);
                psItem.addBatch();

                try (PreparedStatement psStock = con.prepareStatement(
                        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")) {
                    psStock.setInt(1, p.getQuantity());
                    psStock.setInt(2, p.getId());
                    psStock.setInt(3, p.getQuantity());
                    int updated = psStock.executeUpdate();
                    if (updated == 0) {
                        throw new SQLException("Product is out of stock: " + p.getName());
                    }
                }
            }
            psItem.executeBatch();
        }
    }

    private void redirectToMomo(HttpServletRequest request, HttpServletResponse response, HttpSession session,
            int orderId, double total, String momoOrderId) throws IOException, ServletException {
        long amountVnd = Math.max(Math.round(total), MomoConfig.MIN_AMOUNT_VND);
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
        } catch (Exception ex) {
            request.setAttribute("errorMsg", "Cannot create MoMo payment URL: " + ex.getMessage());
            request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
        }
    }

    private void redirectToZaloPay(HttpServletRequest request, HttpServletResponse response, HttpSession session,
            User user, int orderId, double total) throws IOException, ServletException {
        String base = request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort() + request.getContextPath();
        String redirectUrl = base + "/zalopay-return";
        String appUser = user.getEmail() != null && !user.getEmail().isBlank()
                ? user.getEmail()
                : "user_" + user.getId();

        session.setAttribute("ZALOPAY_PENDING_ORDER_ID", orderId);
        try {
            String orderUrl = ZaloPayPaymentHelper.createPayment(Math.round(total), orderId, appUser, redirectUrl);
            response.sendRedirect(orderUrl);
        } catch (Exception ex) {
            request.setAttribute("errorMsg", "Cannot create ZaloPay payment URL: " + ex.getMessage());
            request.getRequestDispatcher("/views/cart.jsp").forward(request, response);
        }
    }

    private String createMomoPayUrl(long amountVnd, String momoOrderId, String orderInfo,
            String redirectUrl, String ipnUrl) throws Exception {
        if (!MomoConfig.USE_NODE_PROXY) {
            return MomoPaymentHelper.createPayment(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
        }
        try {
            return MomoNodeClient.createPayment(amountVnd, momoOrderId, orderInfo, redirectUrl, ipnUrl);
        } catch (Exception e) {
            if (isConnectionRefused(e)) {
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
