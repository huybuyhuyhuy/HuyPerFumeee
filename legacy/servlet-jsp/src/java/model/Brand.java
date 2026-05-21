package model;

public class Brand {
    private int id;
    private String name;

    // Constructor Mặc định
    public Brand() {
    }

    // Constructor có tham số (Cần thiết cho BrandImpl)
    public Brand(int id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getters
    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    // Setters
    public void setId(int id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }
}