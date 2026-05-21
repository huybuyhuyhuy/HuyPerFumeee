package controller;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import data.utils.MomoPaymentHelper;
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
        try {
            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();
            String receivedSignature = body.has("signature") ? body.get("signature").getAsString() : "";
            String computedSignature = MomoPaymentHelper.computeIpnSignature(body);
            if (receivedSignature.isBlank() || !receivedSignature.equals(computedSignature)) {
            getServletContext().log("[MomoIpn] Invalid MoMo signature.");
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid signature");
                return;
            }

            // TODO: cập nhật trạng thái đơn hàng theo orderId/transId ở đây.
            getServletContext().log("[MomoIpn] Verified Momo IPN: " + body);
        } catch (Exception e) {
            getServletContext().log("[MomoIpn] Parse/verify error", e);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Malformed IPN body");
            return;
        }

        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
}
