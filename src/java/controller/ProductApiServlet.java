package controller;

import com.google.gson.Gson;
import data.dao.Database;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.Products;

@WebServlet(name = "ProductApiServlet", urlPatterns = {"/api/products/random"})
public class ProductApiServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        List<Products> list = Database.getProductsDao().findAll();
        
        PrintWriter out = response.getWriter();
        out.print(GSON.toJson(list));
        out.flush();
    }
}
