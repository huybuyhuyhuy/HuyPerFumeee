package data.impl;

import data.dao.ProductsDao;
import data.driver.MySQLDriver;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import model.Products;
import java.util.stream.Collectors; 

public class ProductsImpl implements ProductsDao {
    
    private Products createProductFromResultSet(ResultSet rs) throws SQLException {
        return new Products(rs);
    }

    //lấy tất cả dữ liệu từ bảng
    @Override
    public List<Products> findAll() {
        List<Products> listProducts = new ArrayList<>();
        String str = "SELECT * FROM products"; 
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return listProducts;
            try (PreparedStatement sttm = con.prepareStatement(str);
                 ResultSet rs = sttm.executeQuery()) {
                while(rs.next()){
                    listProducts.add(new Products(rs)); 
                }
            }
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return listProducts;
    }

    //lấy dữ liệu từ bảng Products theo id 
    @Override
    public Products findProducts(int id_products) {
        String sql = "SELECT * FROM products WHERE id = ?"; 
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return null;
            try (PreparedStatement sttm = con.prepareStatement(sql)) {
                sttm.setInt(1, id_products); 
                try (ResultSet rs = sttm.executeQuery()) {
                    if (rs.next()) {
                        return new Products(rs);
                    }
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public List<Products> getProductsByCategoryId(int categoryId) {
        List<Products> listProducts = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE id_category = ?";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return listProducts;
            try (PreparedStatement sttm = con.prepareStatement(sql)) {
                sttm.setInt(1, categoryId);
                try (ResultSet rs = sttm.executeQuery()) {
                    while(rs.next()){
                        listProducts.add(createProductFromResultSet(rs));
                    }
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listProducts;
    }

    @Override
    public List<Products> getProductsByBrandIds(List<Integer> brandIds) {
        if (brandIds == null || brandIds.isEmpty()) return new ArrayList<>();
        List<Products> listProducts = new ArrayList<>();
        String placeholders = brandIds.stream().map(id -> "?").collect(Collectors.joining(", "));
        String sql = "SELECT * FROM products WHERE id_brand IN (" + placeholders + ")";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return listProducts;
            try (PreparedStatement sttm = con.prepareStatement(sql)) {
                for (int i = 0; i < brandIds.size(); i++) {
                    sttm.setInt(i + 1, brandIds.get(i));
                }
                try (ResultSet rs = sttm.executeQuery()) {
                    while(rs.next()){
                        listProducts.add(createProductFromResultSet(rs));
                    }
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listProducts;
    }

    //lấy thương hiệu theo id
    @Override
    public List<Products> getProductsByBrandId(int brandId) {
        List<Products> list = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE id_brand = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, brandId);
            try (ResultSet rs = sttm.executeQuery()) {
                while (rs.next()) {
                    list.add(new Products(rs));
                }
            }
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return list;
    }

    // tìm kiếm tên
    @Override
    public List<Products> findByName(String txtSearch) {
        List<Products> listProducts = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE name LIKE ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, "%" + txtSearch + "%");
            try (ResultSet rs = sttm.executeQuery()) {
                while (rs.next()) {
                    listProducts.add(createProductFromResultSet(rs));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listProducts;
    }

    //lọc trang
    @Override
    public List<Products> findProductsByPage(int offset, int limit) {
        return findProductsByPage(offset, limit, "newest");
    }

    @Override
    public List<Products> findProductsByPage(int offset, int limit, String sort) {
        List<Products> listProducts = new ArrayList<>();
        String orderBy = "id DESC";
        if ("price_asc".equals(sort)) {
            orderBy = "COALESCE(NULLIF(discount_price, 0), price) ASC";
        } else if ("price_desc".equals(sort)) {
            orderBy = "COALESCE(NULLIF(discount_price, 0), price) DESC";
        }

        String sql = "SELECT * FROM products WHERE status = 1 ORDER BY " + orderBy + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, offset);
            sttm.setInt(2, limit);
            try (ResultSet rs = sttm.executeQuery()) {
                while (rs.next()) {
                    listProducts.add(createProductFromResultSet(rs));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listProducts;
    }

    @Override //đếm tên sản phẩm
    public int countAllProducts() {
        String sql = "SELECT COUNT(*) FROM products WHERE status = 1";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql);
             ResultSet rs = sttm.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return 0;
    }

    @Override 
    // thêm dữ liệu cho trang cho trang products
    public boolean insert(Products p) {
        String sql = "INSERT INTO products (sku, batch_code, name, price, discount_price, image, scent_notes, is_decant, status, id_category, id_brand, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, p.getSku());
            sttm.setString(2, p.getBatch_code());
            sttm.setString(3, p.getName());
            sttm.setDouble(4, p.getPrice());
            sttm.setDouble(5, p.getDiscount_price());
            sttm.setString(6, p.getImage());
            sttm.setString(7, p.getScent_notes());
            sttm.setBoolean(8, p.isIs_decant());
            sttm.setBoolean(9, p.isStatus());
            sttm.setInt(10, p.getId_category());
            sttm.setInt(11, p.getId_brand());
            sttm.setInt(12, p.getStock());
            return sttm.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    //cập nhật dữ liệu sp cho trang products
    @Override
    public boolean update(Products p) {
        String sql = "UPDATE products SET sku=?, batch_code=?, name=?, price=?, discount_price=?, image=?, scent_notes=?, is_decant=?, status=?, id_category=?, id_brand=?, stock=? WHERE id=?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            
            sttm.setString(1, p.getSku());
            sttm.setString(2, p.getBatch_code());
            sttm.setString(3, p.getName());
            sttm.setDouble(4, p.getPrice());
            sttm.setDouble(5, p.getDiscount_price());
            sttm.setString(6, p.getImage());
            sttm.setString(7, p.getScent_notes());
            sttm.setBoolean(8, p.isIs_decant());
            sttm.setBoolean(9, p.isStatus());
            sttm.setInt(10, p.getId_category());
            sttm.setInt(11, p.getId_brand());
            sttm.setInt(12, p.getStock());
            sttm.setInt(13, p.getId());
            
            int rowsAffected = sttm.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    //xóa dữ liệu sp trong admin products  
    @Override
    public boolean delete(int id) {
        String sql = "DELETE FROM products WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, id);
            return sttm.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    @Override
    public Products getDetail(int id) {
        String sql = "SELECT * FROM products WHERE id = ?"; 
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, id); 
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) {
                    return new Products(rs);
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(ProductsImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public boolean updateStock(int id, int quantity) {
        String sql = "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, quantity);
            sttm.setInt(2, id);
            sttm.setInt(3, quantity);
            return sttm.executeUpdate() > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean updateStatus(int id, boolean status) {
        String sql = "UPDATE products SET status = ? WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, status ? 1 : 0);
            sttm.setInt(2, id);
            int rows = sttm.executeUpdate();
            return rows > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean setStock(int id, int stock) {
        String sql = "UPDATE products SET stock = ? WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, stock);
            sttm.setInt(2, id);
            int rows = sttm.executeUpdate();
            return rows > 0;
        } catch (SQLException ex) {
            ex.printStackTrace();
        }
        return false;
    }
}
