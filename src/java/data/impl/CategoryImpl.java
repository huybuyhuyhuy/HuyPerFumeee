 /*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
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

/**
 *
 * @author huyle
 */
public class CategoryImpl implements CategoryDao {
    public List<Category> findAll(){
        List<Category> listCategory = new ArrayList<>();
        Connection con = MySQLDriver.getConnection();
        String str = "select * from categories";
        try {
            PreparedStatement sttm = con.prepareStatement(str);
            ResultSet rs = sttm.executeQuery();
            while(rs.next()){
                int id = rs.getInt("id");
                String name = rs.getString("name");
                listCategory.add(new Category(id, name));
            }
        } catch (SQLException ex) {
            Logger.getLogger(CategoryImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return listCategory;
    }
    public void insert(String name){}
    public void delete(int id){}
    public void update(int id, String name, String newName){}
}
