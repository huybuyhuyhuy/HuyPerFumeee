package controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;

/**
 * IPN MoMo (server-to-server). Localhost không nhận được trừ khi dùng ngrok.
 * Trả 204 để MoMo biết đã nhận (theo tài liệu thường dùng HTTP 204 hoặc 200 + JSON).
 */
@WebServlet(name = "MomoIpnServlet", urlPatterns = {"/momo-ipn"})
public class MomoIpnServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        // Có thể parse JSON, cập nhật trạng thái đơn theo orderId / transId
        log("Momo IPN: " + sb);

        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    public void log(String msg) {
        System.out.println("[MomoIpn] " + msg);
    }
}
