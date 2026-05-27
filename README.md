# Huy Perfume

Dự án hiện tại dùng một đường chạy chính rõ ràng:

- `frontend/`: React + Vite
- `server/`: Express API
- `database_setup.sql`: SQL Server seed script

Các nhánh cũ bằng Servlet/JSP, Spring Boot và MoMo proxy sẽ được giữ trong `legacy/` để tham khảo, nhưng không còn là đường chạy mặc định.

Hai thư mục `luxury-perfume-homepage/` và `luxury-perfume-listing/` là prototype giao diện Next.js độc lập. Chúng không được dùng bởi lệnh chạy, Docker image hoặc quy trình deploy của ứng dụng chính; chỉ giữ lại khi còn cần đối chiếu thiết kế.

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

## Luu du lieu va tu khoi dong tren Windows

Duong chay local dung SQL Server trong `server/.env`. Du lieu san pham, tai
khoan, don hang, gio hang va lien he nam trong database `huyperfume`, khong nam
trong tien trinh Node. Khong chay lai `database_setup.sql` khi may khoi dong
hoac khi da co du lieu, vi day la script tao/seed ban dau.

Chay migration xac thuc mot lan de refresh token va cac du lieu tai khoan mo
rong duoc luu trong SQL Server thay vi RAM:

```powershell
cd server
npm.cmd run db:migrate:auth
```

Cai dat tu dong nap backend va ca hai frontend sau khi dang nhap Windows:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\install-huyperfume-startup.ps1 -StartNow
```

Script tu khoi dong chi mo API va frontend, khong seed/xoa database. SQL Server
can de service o che do `Automatic`. Log chay local duoc luu trong
`.runtime\logs`.

Quan ly che do tu khoi dong:

```powershell
# Kiem tra
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\install-huyperfume-startup.ps1 -Action Status

# Tat tien trinh do script da mo
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\stop-huyperfume.ps1

# Go tu khoi dong
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\install-huyperfume-startup.ps1 -Action Remove
```

Tài khoản admin mẫu:

- Email: `admin@huyperfume.com`
- Password: `admin123`

## Ghi chú kỹ thuật

- Backend đang tối ưu theo hướng **Express-first** vì frontend hiện tại đã gọi trực tiếp backend này.
- Các lựa chọn MoMo/ZaloPay trên giao diện hiện mới được lưu như phương thức thanh toán; gateway thật chưa được tích hợp vào backend Express.
- Nếu muốn phát triển lâu dài, bước tiếp theo hợp lý nhất là tích hợp payment vào `server/`, rồi xoá hẳn hoặc tách repo `legacy/` sang nơi khác.
