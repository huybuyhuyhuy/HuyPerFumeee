package data.dao;

import java.util.List;
import model.Products;

public interface ProductsDao {
    
    public List<Products> findAll();
    
    public Products findProducts(int id_products);
    
    public List<Products> getProductsByCategoryId(int categoryId); 
   
    public List<Products> getProductsByBrandIds(List<Integer> brandIds);

    public List<Products> findByName(String txtSearch);

    public List<String> getPerfumeNamesByScentOrKeyword(String scent, String keyword, int limit);

    public List<String> getLightScentPerfumes();
    
    public List<Products> getProductsByBrandId(int brandId);
    
    public Products getDetail(int id);
    
    //phân trang
    List<Products> findProductsByPage(int offset, int limit);
    List<Products> findProductsByPage(int offset, int limit, String sort);
    int countAllProducts();
    boolean insert(Products p);
    boolean update(Products p);
    boolean delete(int id);
    boolean updateStock(int id, int quantity);
    boolean updateStatus(int id, boolean status);
    boolean setStock(int id, int stock);
}
