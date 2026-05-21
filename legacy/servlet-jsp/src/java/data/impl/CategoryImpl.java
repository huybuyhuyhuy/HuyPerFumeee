package data.impl;

import data.dao.CategoryDao;
import data.driver.MySQLDriver;
import java.util.List;
import model.Category;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CategoryImpl implements CategoryDao {
    public List<Category> findAll(){
        List<Category> listCategory = new ArrayList<>();
        String str = "select * from categories";
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return listCategory;
            try (PreparedStatement sttm = con.prepareStatement(str);
                 ResultSet rs = sttm.executeQuery()) {
                while(rs.next()){
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    listCategory.add(new Category(id, name));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listCategory;
    }
    public Category findById(int id) {
        String sql = "SELECT * FROM categories WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, id);
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) {
                    return new Category(rs.getInt("id"), rs.getString("name"));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    public void insert(String name){
        String sql = "INSERT INTO categories (name) VALUES (?)";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, name);
            sttm.executeUpdate();
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    public void delete(int id){
        String sql = "DELETE FROM categories WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setInt(1, id);
            sttm.executeUpdate();
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    public void update(int id, String name, String newName){
        String sql = "UPDATE categories SET name = ? WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, newName);
            sttm.setInt(2, id);
            sttm.executeUpdate();
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
