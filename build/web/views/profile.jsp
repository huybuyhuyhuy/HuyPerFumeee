<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .profile-container {
        background: #f8f9fa;
        padding: 60px 0;
        min-height: 80vh;
    }
    .profile-card {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.05);
        overflow: hidden;
        border: none;
    }
    .profile-header {
        background: linear-gradient(135deg, #003D2E 0%, #005e47 100%);
        padding: 40px;
        text-align: center;
        color: #fff;
    }
    .profile-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 5px solid rgba(255,255,255,0.2);
        margin-bottom: 20px;
        object-fit: cover;
    }
    .profile-body {
        padding: 40px;
    }
    .info-label {
        font-weight: 700;
        color: #003D2E;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
        display: block;
    }
    .info-value {
        font-size: 1rem;
        color: #333;
        margin-bottom: 25px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }
    .btn-edit-profile {
        background: #003D2E;
        color: #fff;
        border: none;
        padding: 12px 30px;
        border-radius: 50px;
        font-weight: 700;
        transition: all 0.3s;
        width: 100%;
        margin-top: 20px;
    }
    .btn-edit-profile:hover {
        background: #005e47;
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0,61,46,0.2);
        color: #fff;
    }
    .form-control-lux {
        border-radius: 10px;
        padding: 12px 15px;
        border: 1px solid #eee;
        background: #fdfdfd;
    }
    .form-control-lux:focus {
        border-color: #003D2E;
        box-shadow: 0 0 0 0.2rem rgba(0,61,46,0.1);
    }
</style>

<div class="profile-container">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="profile-card">
                    <div class="profile-header">
                        <img src="https://ui-avatars.com/api/?name=${user.name}&background=fff&color=003D2E&size=128" class="profile-avatar" alt="Avatar">
                        <h2 class="fw-800 mb-1">${user.name}</h2>
                        <p class="opacity-75 mb-0">${user.email}</p>
                    </div>
                    <div class="profile-body">
                        <c:if test="${not empty successMsg}">
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <i class="fas fa-check-circle me-2"></i> ${successMsg}
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        </c:if>

                        <form action="profile" method="POST">
                            <div class="row">
                                <div class="col-md-6">
                                    <label class="info-label">Họ và tên</label>
                                    <input type="text" name="name" class="form-control form-control-lux mb-3" value="${user.name}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="info-label">Số điện thoại</label>
                                    <input type="text" name="phone" class="form-control form-control-lux mb-3" value="${user.phone}" required>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <label class="info-label">Ngày sinh</label>
                                    <input type="date" name="dob" class="form-control form-control-lux mb-3" value="${user.dob}">
                                </div>
                                <div class="col-md-6">
                                    <label class="info-label">Tuổi</label>
                                    <input type="text" class="form-control form-control-lux mb-3 bg-light" value="${user.getAge()} tuổi" readonly>
                                </div>
                            </div>

                            <label class="info-label">Địa chỉ nơi sinh sống</label>
                            <textarea name="address" class="form-control form-control-lux mb-4" rows="3">${user.address}</textarea>

                            <button type="submit" class="btn btn-edit-profile">
                                <i class="fas fa-save me-2"></i> LƯU THÔNG TIN CÁ NHÂN
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>
