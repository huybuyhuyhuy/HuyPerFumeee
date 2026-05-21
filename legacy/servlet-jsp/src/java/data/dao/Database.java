package data.dao;

import data.impl.BrandImpl;
import data.impl.CategoryImpl;
import data.impl.ProductsImpl;
import data.impl.UserImpl;
import data.impl.WishlistImpl;

public class Database {
    private static final CategoryDao CATEGORY_DAO = new CategoryImpl();
    private static final ProductsDao PRODUCTS_DAO = new ProductsImpl();
    private static final UserDao USER_DAO = new UserImpl();
    private static final BrandDAO BRAND_DAO = new BrandImpl();
    private static final WishlistDao WISHLIST_DAO = new WishlistImpl();

    public static CategoryDao getCategoryDao(){
        return CATEGORY_DAO;
    }
    public static ProductsDao getProductsDao(){
        return PRODUCTS_DAO;
    }
    public static UserDao getUsersDao(){
        return USER_DAO; 
    }
    public static BrandDAO getBrandDao() {
        return BRAND_DAO;
    }
    public static WishlistDao getWishlistDao() {
        return WISHLIST_DAO;
    }
}
