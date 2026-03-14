/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package controller;

import data.dao.Database;
import data.utils.API;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import model.User;

/**
 *
 * @author minhh
 */
@WebServlet(name = "RegisterServlet", urlPatterns = {"/register"})
public class RegisterServlet extends HttpServlet {

    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        try (PrintWriter out = response.getWriter()) {
            /* TODO output your page here. You may use following sample code. */
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet RegisterServlet</title>");
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet RegisterServlet at " + request.getContextPath() + "</h1>");
            out.println("</body>");
            out.println("</html>");
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    //laáy dữ liệu và hiển thị
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("title","Register Page ...");
        request.getRequestDispatcher("./views/register.jsp").forward(request, response);
    }
@Override
        //lưu dữ liệu và xử lí
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String err_email="",err_phone="",err_repass="";
        String name =request.getParameter("name");
        String email =request.getParameter("email");
        String phone=request.getParameter("phone");
        String password=request.getParameter("password");
        String repassword =request.getParameter("repassword");
        
        // Cần đảm bảo trường mật khẩu không rỗng
        if (password == null || password.isEmpty()) {
            password = "";
        }
        
        String Email_Regex = "^[\\w-\\+]+(\\.[\\w]+)*@[\\w-]+(\\.[\\w]+)*(\\.[a-z]{2,})$";
        String Phone_Regex="^\\d{10}$";
        boolean err=false;
        
      
        
        if (!email.matches(Email_Regex)){
            err_email="Email is invalid !";
            request.getSession().setAttribute("err_email",err_email);
            err=true;
        }else{
            request.getSession().removeAttribute("err_email");
        }
        
        if (!phone.matches(Phone_Regex)){
            err_phone="Phone has 10 digits!";
            request.getSession().setAttribute("err_phone", err_phone);
            err=true;
        }else{
            request.getSession().removeAttribute("err_phone");
        }
        
        if (!repassword.equals(password)){ // Dùng .equals() để so sánh String an toàn hơn
            err_repass="No match password !";
            request.getSession().setAttribute("err_repass", err_repass);
            err=true;
        }else{
            request.getSession().removeAttribute("err_repass");
        }
        
        if (err){
            // Lưu lại thông tin đã nhập để hiển thị lại (trừ mật khẩu)
            request.getSession().setAttribute("name", name);
            request.getSession().setAttribute("email", email);
            request.getSession().setAttribute("phone", phone);
            request.getSession().setAttribute("address", request.getParameter("address"));
            
            response.sendRedirect("register");
            return; // Dừng nếu có lỗi định dạng
        }
        
       
        boolean existError = false;

        if(Database.getUsersDao().findUser(email) != null){
            request.getSession().setAttribute("err_exist_email","Email đã được sử dụng!");
            existError = true;
        } else {
            request.getSession().removeAttribute("err_exist_email");
        }

        if(Database.getUsersDao().findUser(phone) != null){
            request.getSession().setAttribute("err_exist_phone","Số điện thoại đã được sử dụng!");
            existError = true;
        } else {
            request.getSession().removeAttribute("err_exist_phone");
        }

        if(existError){
            // Lưu lại thông tin đã nhập (trừ mật khẩu)
            request.getSession().setAttribute("name", name);
            request.getSession().setAttribute("email", email);
            request.getSession().setAttribute("phone", phone);
            request.getSession().setAttribute("address", request.getParameter("address"));
            
            response.sendRedirect("register");
            return; // Dừng nếu email/phone đã tồn tại
        }

        String address = request.getParameter("address");
        if (address == null) address = "";
            
        Database.getUsersDao().insertUser(name, email, phone, API.getMd5(password), address);
        
        // --- XÓA THÔNG TIN ĐÃ LƯU TRONG SESSION SAU KHI ĐĂNG KÝ THÀNH CÔNG ---
        request.getSession().removeAttribute("name");
        request.getSession().removeAttribute("email");
        request.getSession().removeAttribute("phone");
        request.getSession().removeAttribute("address");
        // ------------------------------------------------------------------
        
        // ------------------ 4. LOGIN VÀ CHUYỂN HƯỚNG ------------------
        
        User user = Database.getUsersDao().findUser(email);
        
        // Nếu insert thành công và tìm thấy user
        if (user != null) {
            request.getSession().removeAttribute("exist_user"); 
            
            // LƯU ROLE VÀO SESSION (Đồng bộ với LoginServlet đã sửa)
            request.getSession().setAttribute("user", user);
            request.getSession().setAttribute("role", user.getRole());
            
            response.sendRedirect("home");
        } else {
           
            request.getSession().setAttribute("exist_user", "Lỗi hệ thống khi tạo tài khoản!");
            response.sendRedirect("register");
        }
    }
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
