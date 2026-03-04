package data.dao;

import java.util.List;
import model.Products;

public interface ProductsDao {
    
    public List<Products> findAll();
    
    public Products findProducts(int id_products);
    
    public List<Products> getProductsByCategoryId(int categoryId); 
   
    public List<Products> getProductsByBrandIds(List<Integer> brandIds);

    public List<Products> findByName(String txtSearch);
    
    public List<Products> getProductsByBrandId(int brandId);
    
   //phân trang
    List<Products> findProductsByPage(int offset, int limit);
    int countAllProducts();
    boolean insert(Products p);
boolean update(Products p);
boolean delete(int id);
}