package controller;

import data.dao.Database;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.Part;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import model.Brand;
import model.Category;
import model.Products;

// SỬA: Đổi "/add" thành đường dẫn khớp với link trong _admin.jsp
@WebServlet(name = "AddProductsServlet", urlPatterns = {"/admin/product/add"})
@MultipartConfig
public class AddProductsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Forward đến đúng file trong thư mục inc
        request.setAttribute("listCategory", Database.getCategoryDao().findAll());
        request.setAttribute("listBrands", Database.getBrandDao().getAllBrands());
        request.getRequestDispatcher("/inc/add-products.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        try {
            String name = request.getParameter("name");
            double price = Double.parseDouble(request.getParameter("price"));
            double discountPrice = 0;
            String discountPriceStr = request.getParameter("discount_price");
            if (discountPriceStr != null && !discountPriceStr.isEmpty()) {
                discountPrice = Double.parseDouble(discountPriceStr);
            }
            String image = request.getParameter("image");
            Part imagePart = request.getPart("imageFile");
            String uploadedImage = saveImageFile(request, imagePart);
            if (uploadedImage != null) {
                image = uploadedImage;
            }
            String sku = request.getParameter("sku");
            String batchCode = request.getParameter("batch_code");
            String scentNotes = request.getParameter("scent_notes");
            boolean isDecant = request.getParameter("is_decant") != null;
            int categoryId = Integer.parseInt(request.getParameter("categoryId"));
            int brandId = Integer.parseInt(request.getParameter("brandId"));
            int stock = Integer.parseInt(request.getParameter("stock"));
            boolean status = request.getParameter("status") != null;




            Products p = new Products();
            p.setName(name);
            p.setPrice(price);
            p.setDiscount_price(discountPrice);
            p.setImage(image);
            p.setSku(sku);
            p.setBatch_code(batchCode);
            p.setScent_notes(scentNotes);
            p.setIs_decant(isDecant);
            p.setId_category(categoryId);
            p.setId_brand(brandId);
            p.setStock(stock);
            p.setStatus(status);

            Database.getProductsDao().insert(p);
            response.sendRedirect(request.getContextPath() + "/admin");
        } catch (Exception e) {
            getServletContext().log("Error in AddProductsServlet", e);
            response.sendRedirect(request.getContextPath() + "/admin/product/add?error=1");
        }
    }

    private String saveImageFile(HttpServletRequest request, Part imagePart) throws IOException {
        if (imagePart == null || imagePart.getSize() <= 0) {
            return null;
        }
        String submitted = Paths.get(imagePart.getSubmittedFileName()).getFileName().toString();
        if (submitted == null || submitted.trim().isEmpty()) {
            return null;
        }

        String ext = "";
        int dotIdx = submitted.lastIndexOf('.');
        if (dotIdx > -1) {
            ext = submitted.substring(dotIdx).toLowerCase();
        }
        if (!".jpg".equals(ext) && !".jpeg".equals(ext) && !".png".equals(ext) && !".webp".equals(ext) && !".gif".equals(ext)) {
            throw new IOException("Định dạng ảnh không hợp lệ. Chỉ hỗ trợ jpg, jpeg, png, webp, gif.");
        }

        String fileName = UUID.randomUUID().toString().replace("-", "") + ext;
        String uploadDir = request.getServletContext().getRealPath("/assets/images");
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        Path target = uploadPath.resolve(fileName);
        try (InputStream in = imagePart.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return fileName;
    }
}