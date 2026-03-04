package model;
import java.sql.ResultSet;
import java.sql.SQLException;

public class Products {
    private int id, id_category, id_brand, quantity; // Đã thêm id_brand
    private String image, name;
    private double price;
    private boolean status;
    public Products() {
    }

    public Products(int id, int id_category, int quantity, String image, String name, double price, boolean status) {
        this.id = id;
        this.id_category = id_category;
        this.quantity = quantity;
        this.image = image;
        this.name = name;
        this.price = price;
        this.status = status;
    }

    public Products(ResultSet rs) throws SQLException {
        this.id = rs.getInt("id");
        this.name = rs.getString("name");
        this.image = rs.getString("image");
        this.price = rs.getDouble("price");
        try { this.id_category = rs.getInt("id_category"); } catch (Exception e) {}
        try { this.id_brand = rs.getInt("id_brand"); } catch (Exception e) {}
        try { this.status = rs.getBoolean("status"); } catch (Exception e) {}
        this.quantity = 1; 
    }
   
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getId_category() { return id_category; }
    public void setId_category(int id_category) { this.id_category = id_category; }

    public int getId_brand() { return id_brand; }
    public void setId_brand(int id_brand) { this.id_brand = id_brand; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }
}