package data.impl;
import data.dao.UserDao;
import data.driver.MySQLDriver;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;
import model.User;

public class UserImpl implements UserDao {
    
    @Override
    public User findUser(String emailphone, String password) {
        String sql;
        if (emailphone.contains("@")) {
            sql = "SELECT * FROM users WHERE email = ? AND password = ?";
        } else {
            sql = "SELECT * FROM users WHERE phone = ? AND password = ?";
        }
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, emailphone);
            sttm.setString(2, password);
            try (ResultSet rs = sttm.executeQuery()) {
                if (rs.next()) return new User(rs);
            }
        } catch (SQLException ex) {
            Logger.getLogger(UserImpl.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Override
    public User findUser(String emailphone) {
        String sql;
        if (emailphone.contains("@")) {
            sql = "SELECT * FROM users WHERE email = ?";
        } else {
            sql = "SELECT * FROM users WHERE phone = ?";
        }
        try (Connection con = MySQLDriver.getConnection();
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
    public void insertUser(String name, String email, String phone, String password, String address) {
        String sql = "INSERT INTO users (name, email, phone, password, role, address) VALUES (?, ?, ?, ?, 'user', ?)";
        try (Connection con = MySQLDriver.getConnection();
             PreparedStatement sttm = con.prepareStatement(sql)) {
            sttm.setString(1, name);
            sttm.setString(2, email);
            sttm.setString(3, phone);
            sttm.setString(4, password);
            sttm.setString(5, address);
            sttm.execute();
        } catch (SQLException e) {
            e.printStackTrace();
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