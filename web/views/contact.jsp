<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<div class="container my-5 py-5 text-center">
    <h1 class="fw-bold mb-4">LIÊN HỆ VỚI HUY PERFUME</h1>
    <div class="row justify-content-center">
        <div class="col-md-6 text-start">
            <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
                <form>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Họ và tên</label>
                        <input type="text" class="form-control" placeholder="Nhập tên của bạn...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Email</label>
                        <input type="email" class="form-control" placeholder="Nhập email của bạn...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Lời nhắn</label>
                        <textarea class="form-control" rows="5" placeholder="Bạn cần chúng tôi giúp gì?"></textarea>
                    </div>
                    <button type="submit" class="btn btn-dark w-100 py-2 fw-bold">GỬI LỜI NHẮN</button>
                </form>
            </div>
        </div>
        <div class="col-md-4 text-start">
            <div class="p-4 bg-white shadow-sm rounded-4">
                <h5 class="fw-bold mb-3">Thông tin liên hệ</h5>
                <p class="mb-2"><i class="fas fa-map-marker-alt me-2 text-success"></i> Thừa Thiên Huế</p>
                <p class="mb-2"><i class="fas fa-phone-alt me-2 text-success"></i> 0906.530.794</p>
                <p class="mb-2"><i class="fas fa-envelope me-2 text-success"></i> huyperfume@gmail.com</p>
                <div class="mt-4">
                    <a href="#" class="btn btn-sm btn-outline-dark me-2"><i class="fab fa-facebook"></i></a>
                    <a href="#" class="btn btn-sm btn-outline-dark me-2"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="btn btn-sm btn-outline-dark"><i class="fab fa-tiktok"></i></a>
                </div>
            </div>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>
