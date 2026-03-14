/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package data.dao;
import model.User;
/**
 *
 * @author huyle
 */
public interface UserDao {
    public User findUser (String emailphone,String password);
    public User findUser (String emailphone);
    public void insertUser (String name,String email,String phone, String password, String address);
    public void updateUser(User user);
}
