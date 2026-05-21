package controller;

import com.google.gson.Gson;
import data.dao.Database;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import model.Products;

@WebServlet(name = "RandomProductsServlet", urlPatterns = {"/api/products/random"})
public class RandomProductsServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        List<Products> all = Database.getProductsDao().findAll();
        List<Products> available = new ArrayList<>();
        for (Products p : all) {
            if (p.isStatus() && p.getStock() > 0) {
                available.add(p);
            }
        }

        Collections.shuffle(available);
        int maxCount = Math.min(10, available.size());
        int limit = available.isEmpty() ? 0 : new Random().nextInt(maxCount) + 1;
        List<Products> random = available.subList(0, limit);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(GSON.toJson(random));
    }
}
