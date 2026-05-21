package data.dao;
import java.sql.SQLException;
import model.User;

public interface UserDao {
    User findUser(String emailphone, String password);
    User findUser(String emailphone);
    void insertUser(String name, String email, String phone, String password, String address) throws SQLException;
    void updateUser(User user);
    void updatePasswordByEmail(String email, String hashedPassword) throws SQLException;
}
