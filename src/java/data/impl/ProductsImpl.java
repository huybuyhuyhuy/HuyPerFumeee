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
    try (Connection con = MySQLDriver.getConnection();
         PreparedStatement sttm = con.prepareStatement(str);
         ResultSet rs = sttm.executeQuery()) {
        while(rs.next()){
            
            listProducts.add(new Products(rs)); 
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
    try (Connection con = MySQLDriver.getConnection();
         PreparedStatement sttm = con.prepareStatement(sql)) {
        
        sttm.setInt(1, id_products); 
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
    public List<Products> getProductsByCategoryId(int categoryId) {
        List<Products> listProducts = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE id_category = ? AND status = TRUE";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, categoryId);
            try (ResultSet rs = sttm.executeQuery()) {
                while(rs.next()){
                    listProducts.add(createProductFromResultSet(rs));
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
        String sql = "SELECT * FROM products //WHERE id_brand IN (" + placeholders + ") AND status = TRUE";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            for (int i = 0; i < brandIds.size(); i++) {
                sttm.setInt(i + 1, brandIds.get(i));
            }
            try (ResultSet rs = sttm.executeQuery()) {
                while(rs.next()){
                    listProducts.add(createProductFromResultSet(rs));
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
        String sql = "SELECT * FROM products WHERE name LIKE ? AND status = TRUE";
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
    List<Products> listProducts = new ArrayList<>();
    String sql = "SELECT * FROM products WHERE status = TRUE LIMIT ?, ?"; 
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
    String sql = "SELECT COUNT(*) FROM products WHERE status = TRUE";
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
    String sql = "INSERT INTO products (name, price, image, status, id_category, id_brand) VALUES (?, ?, ?, ?, ?, ?)";
    try (Connection con = MySQLDriver.getConnection();
         PreparedStatement sttm = con.prepareStatement(sql)) {
        sttm.setString(1, p.getName());
        sttm.setDouble(2, p.getPrice());
        sttm.setString(3, p.getImage());
        sttm.setBoolean(4, p.isStatus());
        sttm.setInt(5, p.getId_category());
        sttm.setInt(6, p.getId_brand());
        return sttm.executeUpdate() > 0;
    } catch (SQLException ex) {
        ex.printStackTrace();
    }
    return false;
}
            //cập nhật dữ liệu sp cho trang products
@Override
public boolean update(Products p) {
    String sql = "UPDATE products SET name=?, price=?, image=?, status=?, id_category=?, id_brand=? WHERE id=?";
    try (Connection con = MySQLDriver.getConnection();
         PreparedStatement sttm = con.prepareStatement(sql)) {
        sttm.setString(1, p.getName());
        sttm.setDouble(2, p.getPrice());
        sttm.setString(3, p.getImage());
        sttm.setBoolean(4, p.isStatus());
        sttm.setInt(5, p.getId_category());
        sttm.setInt(6, p.getId_brand());
        sttm.setInt(7, p.getId());
        return sttm.executeUpdate() > 0;
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
}