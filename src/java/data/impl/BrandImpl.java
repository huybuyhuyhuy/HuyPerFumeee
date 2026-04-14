package data.impl;

import data.dao.BrandDAO;
import data.driver.MySQLDriver;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import model.Brand;

/**
 *
 * @author huyle
 */
public class BrandImpl implements BrandDAO {

    @Override
    public List<Brand> getAllBrands() {
        List<Brand> listBrands = new ArrayList<>();
        String sql = "SELECT id, name FROM brand WHERE status = 1"; // Lấy thương hiệu có status = true/1
        
        try (Connection con = MySQLDriver.getConnection()) {
            if (con == null) return listBrands;
            try (PreparedStatement sttm = con.prepareStatement(sql);
                 ResultSet rs = sttm.executeQuery()) {
                while(rs.next()){
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    Brand brand = new Brand(id, name);
                    listBrands.add(brand);
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(BrandImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listBrands;
    }

    @Override
    public Brand getBrandById(int id) {
        String sql = "SELECT id, name FROM brand WHERE id = ? LIMIT 1";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            if (con == null) return null;
            sttm.setInt(1, id);
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) {
                    return new Brand(rs.getInt("id"), rs.getString("name"));
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(BrandImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
}