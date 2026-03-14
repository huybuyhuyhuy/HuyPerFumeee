package data.dao;

import data.impl.BrandImpl;
import data.impl.CategoryImpl;
import data.impl.ProductsImpl;
import data.impl.UserImpl;

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
    public static BrandDAO getBrandDao() {
        return new BrandImpl();
    }
}
