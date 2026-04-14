package data.dao;

import java.util.List;
import model.Category;

public interface CategoryDao {
    public List<Category> findAll();
    public void insert(String name);
    public void delete(int id);
    public void update(int id, String name, String newName);
}