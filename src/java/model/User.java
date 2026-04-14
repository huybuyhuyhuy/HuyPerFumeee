package model;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.Period;

public class User {
    int id;
    String email, name, password, phone, role, address;
    String dob; // Ngày tháng năm sinh (YYYY-MM-DD)

    public User() {}

    public User(ResultSet rs) throws SQLException {
        this.id = rs.getInt("id");
        this.name = rs.getString("name");
        this.email = rs.getString("email");
        this.phone = rs.getString("phone");
        this.password = rs.getString("password");
        this.role = rs.getString("role");
        
        try {
            this.address = rs.getString("address");
        } catch (SQLException e) {
            this.address = ""; 
        }
        
        try {
            this.dob = rs.getString("dob");
        } catch (SQLException e) {
            this.dob = null;
        }
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAddress() {
        return address != null && !address.isEmpty() ? address : "Chưa cập nhật";
    }
    public void setAddress(String address) { this.address = address; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

    public int getAge() {
        if (dob == null || dob.isEmpty()) return 0;
        try {
            LocalDate birthDate = LocalDate.parse(dob);
            return Period.between(birthDate, LocalDate.now()).getYears();
        } catch (Exception e) {
            return 0;
        }
    }
}
