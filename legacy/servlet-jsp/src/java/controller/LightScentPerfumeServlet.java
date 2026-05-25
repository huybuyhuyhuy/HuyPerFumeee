package controller;

import com.google.gson.Gson;
import data.dao.Database;
import data.dao.ProductsDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "LightScentPerfumeServlet", urlPatterns = {"/light-scent-perfumes"})
public class LightScentPerfumeServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Gson GSON = new Gson();

    private ProductsDao productsDao;

    @Override
    public void init() {
        productsDao = Database.getProductsDao();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");

        try {
            List<String> perfumes = productsDao.getLightScentPerfumes();

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("count", perfumes.size());
            result.put("data", perfumes);

            response.getWriter().write(GSON.toJson(result));
        } catch (Exception ex) {
            ex.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Kh\u00F4ng th\u1EC3 l\u1EA5y danh s\u00E1ch n\u01B0\u1EDBc hoa m\u00F9i nh\u1EB9 nh\u00E0ng");

            response.getWriter().write(GSON.toJson(error));
        }
    }
}
