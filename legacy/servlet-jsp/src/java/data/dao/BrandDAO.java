package data.dao;

import model.Brand;
import java.util.List;

public interface BrandDAO {
    List<Brand> getAllBrands();
    Brand getBrandById(int id);
}