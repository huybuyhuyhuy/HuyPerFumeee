/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package data.dao;

import java.util.List;
import model.Category;

/**
 *
 * @author huyle
 */
public interface CategoryDao {
    public List<Category> findAll();
    public void insert(String name);
    public void delete(int id);
    public void update(int id, String name, String newName);
}