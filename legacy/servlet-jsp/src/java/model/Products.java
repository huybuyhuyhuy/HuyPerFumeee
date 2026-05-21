package model;
import java.sql.ResultSet;
import java.sql.SQLException;

public class Products {
    private int id, id_category, id_brand, quantity, stock; // Đã thêm stock
    private String image, name, sku, batch_code, scent_notes;
    private double price, discount_price;
    private boolean status, is_decant;
    public Products() {
    }

    public Products(int id, int id_category, int quantity, String image, String name, double price, double discount_price, boolean status, int stock) {
        this.id = id;
        this.id_category = id_category;
        this.quantity = quantity;
        this.image = image;
        this.name = name;
        this.price = price;
        this.discount_price = discount_price;
        this.status = status;
        this.stock = stock;
    }

    public Products(ResultSet rs) throws SQLException {
        this.id = rs.getInt("id");
        this.name = rs.getString("name");
        this.image = rs.getString("image");
        try { this.sku = rs.getString("sku"); } catch (Exception e) {}
        try { this.batch_code = rs.getString("batch_code"); } catch (Exception e) {}
        try { this.scent_notes = rs.getString("scent_notes"); } catch (Exception e) {}
        this.price = rs.getDouble("price");
        try { this.discount_price = rs.getDouble("discount_price"); } catch (Exception e) {}
        try { this.id_category = rs.getInt("id_category"); } catch (Exception e) {}
        try { this.id_brand = rs.getInt("id_brand"); } catch (Exception e) {}
        try { this.status = rs.getBoolean("status"); } catch (Exception e) {}
        try { this.is_decant = rs.getBoolean("is_decant"); } catch (Exception e) {}
        try { this.stock = rs.getInt("stock"); } catch (Exception e) {}
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

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getBatch_code() { return batch_code; }
    public void setBatch_code(String batch_code) { this.batch_code = batch_code; }

    public String getScent_notes() { return scent_notes; }
    public void setScent_notes(String scent_notes) { this.scent_notes = scent_notes; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getDiscount_price() { return discount_price; }
    public void setDiscount_price(double discount_price) { this.discount_price = discount_price; }

    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }

    public boolean isIs_decant() { return is_decant; }
    public void setIs_decant(boolean is_decant) { this.is_decant = is_decant; }
}