package data.impl;

import data.dao.WishlistDao;
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

public class WishlistImpl implements WishlistDao {

    @Override
    public List<Products> getWishlistProducts(int userId) {
        List<Products> list = new ArrayList<>();
        String sql = "SELECT p.* FROM wishlist w JOIN products p ON p.id = w.product_id "
                + "WHERE w.user_id = ? ORDER BY w.id DESC";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return list;
            sttm.setInt(1, userId);
            try (ResultSet rs = sttm.executeQuery()) {
                while (rs.next()) {
                    list.add(new Products(rs));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(WishlistImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return list;
    }

    @Override
    public boolean exists(int userId, int productId) {
        String sql = "SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ? LIMIT 1";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return false;
            sttm.setInt(1, userId);
            sttm.setInt(2, productId);
            try (ResultSet rs = sttm.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException ex) {
            Logger.getLogger(WishlistImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return false;
    }

    @Override
    public void add(int userId, int productId) {
        String sql = "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return;
            sttm.setInt(1, userId);
            sttm.setInt(2, productId);
            sttm.executeUpdate();
        } catch (SQLException ex) {
            Logger.getLogger(WishlistImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void remove(int userId, int productId) {
        String sql = "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return;
            sttm.setInt(1, userId);
            sttm.setInt(2, productId);
            sttm.executeUpdate();
        } catch (SQLException ex) {
            Logger.getLogger(WishlistImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public int countByUser(int userId) {
        String sql = "SELECT COUNT(*) FROM wishlist WHERE user_id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return 0;
            sttm.setInt(1, userId);
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException ex) {
            Logger.getLogger(WishlistImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return 0;
    }
}
