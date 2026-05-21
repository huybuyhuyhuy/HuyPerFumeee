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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.util.UUID;
import model.Brand;
import model.Category;
import model.Products;
@WebServlet(name = "EditProductServlet", urlPatterns = {"/admin/product/edit"})
@MultipartConfig
public class EditProductServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        int id = Integer.parseInt(request.getParameter("id"));
        Products p = Database.getProductsDao().findProducts(id);
        request.setAttribute("product", p);
        request.getRequestDispatcher("/inc/edit-products.jsp").forward(request, response);
    }
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        try {
            String idStr = request.getParameter("id");
            String action = request.getParameter("action");

            if (idStr == null || idStr.isEmpty()) {
                throw new Exception("Missing product ID");
            }

            int id = Integer.parseInt(idStr);

            if ("toggle_status".equals(action)) {
                String statusStr = request.getParameter("status");
                boolean newStatus = (statusStr != null && statusStr.equals("on"));
                Database.getProductsDao().updateStatus(id, newStatus);
            } else if ("update_stock".equals(action)) {
                String stockStr = request.getParameter("stock");
                if (stockStr != null && !stockStr.isEmpty()) {
                    int newStock = Integer.parseInt(stockStr);
                    Database.getProductsDao().setStock(id, newStock);
                    if (newStock > 0) {
                        Database.getProductsDao().updateStatus(id, true);
                    }
                }
            } else {
                Products p = Database.getProductsDao().findProducts(id);
                if (p == null) throw new Exception("Sản phẩm không tồn tại");

            String name = request.getParameter("name");
            if (name != null) p.setName(name);

            String priceStr = request.getParameter("price");
            if (priceStr != null) p.setPrice(Double.parseDouble(priceStr));

            String discountPriceStr = request.getParameter("discount_price");
            if (discountPriceStr != null && !discountPriceStr.isEmpty()) {
                p.setDiscount_price(Double.parseDouble(discountPriceStr));
            } else {
                p.setDiscount_price(0);
            }

            String image = request.getParameter("image");
            Part imagePart = request.getPart("imageFile");
            String uploadedImage = saveImageFile(request, imagePart);
            if (uploadedImage != null) {
                p.setImage(uploadedImage);
            } else if (image != null && !image.trim().isEmpty()) {
                p.setImage(image.trim());

            }

            String catIdStr = request.getParameter("categoryId");
            if (catIdStr != null) p.setId_category(Integer.parseInt(catIdStr));

            String brandIdStr = request.getParameter("brandId");
            if (brandIdStr != null) p.setId_brand(Integer.parseInt(brandIdStr));

            String sku = request.getParameter("sku");
            if (sku != null) p.setSku(sku.trim());

            String batchCode = request.getParameter("batch_code");
            if (batchCode != null) p.setBatch_code(batchCode.trim());

            String scentNotes = request.getParameter("scent_notes");
            if (scentNotes != null) p.setScent_notes(scentNotes.trim());

            String isDecant = request.getParameter("is_decant");
            p.setIs_decant(isDecant != null && isDecant.equals("on"));

            String stockStr = request.getParameter("stock");
            if (stockStr != null) p.setStock(Integer.parseInt(stockStr));

                String statusStr = request.getParameter("status");
                p.setStatus(statusStr != null && statusStr.equals("on"));
                Database.getProductsDao().update(p);
            }

            response.sendRedirect(request.getContextPath() + "/admin");
        } catch (Exception e) {
            getServletContext().log("Error in EditProductServlet", e);
            response.sendRedirect(request.getContextPath() + "/admin?error=update_failed");
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
