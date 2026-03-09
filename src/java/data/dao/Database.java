package data.dao;

import data.impl.BrandImpl;
import data.impl.CategoryImpl;
import data.impl.ProductsImpl;
import data.impl.UserImpl;

/**
 *
 * @author huyle
 */ 
public class Database {
    public static CategoryDao getCategoryDao(){
        return new CategoryImpl();
    }
    public static ProductsDao getProductsDao(){
        return new ProductsImpl();
    }
   public static UserDao getUsersDao(){
        return new UserImpl(); 
}
   private static final BrandDAO brandDao = new BrandImpl();
// ...
public static BrandDAO getBrandDao() {
    return brandDao;
}
}