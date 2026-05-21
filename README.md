# Huy Perfume

Dự án hiện tại dùng một đường chạy chính rõ ràng:

- `frontend/`: React + Vite
- `server/`: Express API
- `database_setup.sql`: SQL Server seed script

Các nhánh cũ bằng Servlet/JSP, Spring Boot và MoMo proxy sẽ được giữ trong `legacy/` để tham khảo, nhưng không còn là đường chạy mặc định.

## Chạy nhanh trong VS Code

1. Tạo database SQL Server bằng file `database_setup.sql`.
2. Cài dependency:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix frontend
   ```
3. Tạo file cấu hình local nếu cần:
   - `server/.env` từ `server/.env.example`
   - `frontend/.env` từ `frontend/.env.example`
4. Chạy toàn bộ theo một trong hai cách:
   ```bash
   npm run dev
   ```
   hoặc trong VS Code:
   - mở tab **Run and Debug**
   - chọn **Start Full App (F5)**
   - bấm **F5**

Mặc định:

- Trang user: `http://localhost:5177/`
- Trang admin: `http://localhost:5178/`
- Express API: `http://localhost:4000`

Tài khoản admin mẫu:

- Email: `admin@huyperfume.com`
- Password: `admin123`

## Ghi chú kỹ thuật

- Backend đang tối ưu theo hướng **Express-first** vì frontend hiện tại đã gọi trực tiếp backend này.
- Các lựa chọn MoMo/ZaloPay trên giao diện hiện mới được lưu như phương thức thanh toán; gateway thật chưa được tích hợp vào backend Express.
- Nếu muốn phát triển lâu dài, bước tiếp theo hợp lý nhất là tích hợp payment vào `server/`, rồi xoá hẳn hoặc tách repo `legacy/` sang nơi khác.
