package data.impl;
import data.dao.UserDao;
import data.driver.MySQLDriver;
import data.utils.PasswordUtils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;
import model.User;

public class UserImpl implements UserDao {
    
    private static Connection requireConnection() throws SQLException {
        Connection con = MySQLDriver.getConnection();
        if (con == null) {
            throw new SQLException("Không kết nối được MySQL. Kiểm tra MySQL đang chạy, URL/USER/PASS trong Constants.java và driver JDBC.");
        }
        return con;
    }
    
    @Override
    public User findUser(String emailphone, String password) {
        User user = findUser(emailphone);
        if (user != null && PasswordUtils.verify(password, user.getPassword())) {
            return user;
        }
        return null;
    }

    @Override
    public User findUser(String emailphone) {
        if (emailphone == null || emailphone.isBlank()) {
            return null;
        }
        String sql;
        if (emailphone.contains("@")) {
            sql = "SELECT * FROM users WHERE email = ?";
        } else {
            sql = "SELECT * FROM users WHERE phone = ?";
        }
        try (Connection con = requireConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, emailphone);
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) return new User(rs);
            }
        } catch (SQLException ex) {
            Logger.getLogger(UserImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public void insertUser(String name, String email, String phone, String password, String address) throws SQLException {
        String sql = "INSERT INTO users (name, email, phone, password, role, address) VALUES (?, ?, ?, ?, 'user', ?)";
        try (Connection con = requireConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, name);
            sttm.setString(2, email);
            sttm.setString(3, phone);
            sttm.setString(4, password);
            sttm.setString(5, address == null ? "" : address);
            sttm.executeUpdate();
        }
    }

    @Override
    public void updatePasswordByEmail(String email, String hashedPassword) throws SQLException {
        String sql = "UPDATE users SET password = ? WHERE email = ?";
        try (Connection con = requireConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, hashedPassword);
            sttm.setString(2, email);
            if (sttm.executeUpdate() == 0) {
                throw new SQLException("Không tìm thấy tài khoản với email này.");
            }
        }
    }

    @Override
    public void updateUser(User user) {
        String sql = "UPDATE users SET name = ?, phone = ?, address = ?, dob = ? WHERE id = ?";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, user.getName());
            sttm.setString(2, user.getPhone());
            sttm.setString(3, user.getAddress());
            sttm.setString(4, user.getDob());
            sttm.setInt(5, user.getId());
            sttm.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}