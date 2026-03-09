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
        
        Connection con = MySQLDriver.getConnection();
        String sql = "SELECT id, name FROM brand WHERE status = 1"; // Lấy thương hiệu có status = true/1
        
        PreparedStatement sttm = null;
        ResultSet rs = null;
        
        try {
            sttm = con.prepareStatement(sql);
            rs = sttm.executeQuery();
            
            while(rs.next()){
                int id = rs.getInt("id");
                String name = rs.getString("name");
                
                // Sử dụng Constructor đã thêm vào model.Brand
                Brand brand = new Brand(id, name);
                listBrands.add(brand);
            }
        } catch (SQLException ex) {
            Logger.getLogger(BrandImpl.class.getName()).log(Level.SEVERE, null, ex);
        } finally {
            // Đóng tài nguyên tương tự như ProductsImpl
             try {
                if (rs != null) rs.close();
                if (sttm != null) sttm.close();
                // (Thường không đóng Connection ở đây nếu dùng connection pool)
            } catch (SQLException e) {
                Logger.getLogger(BrandImpl.class.getName()).log(Level.WARNING, "Error closing resources", e);
            }
        }
        return listBrands;
    }
}