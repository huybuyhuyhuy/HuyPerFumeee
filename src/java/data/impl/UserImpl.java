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
    
        Connection con = MySQLDriver.getConnection();
        String s;
     public User findUser(String emailphone, String password){
        if(emailphone.contains("@"))
            s="select * from users where email='"+emailphone+"' and password='"+password+"'";
        else s="select * from users where phone='"+emailphone+"' and password='"+password+"'";
        try {
            PreparedStatement sttm = con.prepareStatement(s);
            ResultSet rs = sttm.executeQuery();
            if(rs.next())return new User(rs);
        } catch (SQLException ex) {
            Logger.getLogger(UserImpl.class.getName()).log(Level.SEVERE, null, ex);

        }
        return null;
    }
     @Override
     public User findUser(String emailphone){
        if(emailphone.contains("@"))
            s="select * from users where email='"+emailphone+"' ";
        else s="select * from users where phone='"+emailphone+"' ";
        try {
            PreparedStatement sttm = con.prepareStatement(s);
            ResultSet rs = sttm.executeQuery();
            if(rs.next())return new User(rs);
        } catch (SQLException ex) {
            Logger.getLogger(UserImpl.class.getName()).log(Level.SEVERE, null, ex); 
        }
        return null;
    }
 @Override
  public void insertUser (String name,String email,String phone, String password){
      String sql="insert into users(name,email,phone,password,role) values('"+name+"','"+email;
    sql = sql + "','"+phone+"','"+password+"','')";
     try {
         PreparedStatement sttm = con.prepareStatement(sql);
         sttm.execute();
     } catch (Exception e) {
         e.printStackTrace();
     }
  }
  
}