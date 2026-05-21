package data.dao;

import java.util.List;
import model.Products;

public interface WishlistDao {
    List<Products> getWishlistProducts(int userId);
    boolean exists(int userId, int productId);
    void add(int userId, int productId);
    void remove(int userId, int productId);
    int countByUser(int userId);
}
