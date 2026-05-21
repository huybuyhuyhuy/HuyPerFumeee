# Hướng Dẫn Chạy ThePerfumeShop Trong VS Code

## 1. Đường Chạy Hiện Tại

Project đang có đường chạy chính như sau:

- Backend: Node.js + Express trong `server/`, chạy ở `http://localhost:4000`
- Frontend user: React + Vite trong `frontend/`, chạy ở `http://localhost:5177`
- Frontend admin: React + Vite trong `frontend/`, chạy ở `http://localhost:5178`
- Database: SQL Server database tên `huyperfume`
- Legacy Java Servlet/JSP, Spring Boot và MoMo proxy cũ vẫn được giữ trong `legacy/` để tham khảo, không phải đường chạy mặc định hiện tại.

## 2. Chuẩn Bị

Cần cài:

- Node.js
- npm
- VS Code
- SQL Server đang chạy local
- ODBC Driver 18 for SQL Server nếu dùng Windows Authentication với `msnodesqlv8`

Mở project bằng VS Code tại thư mục:

```bat
D:\Java1\ThePerfumeShop
```

## 3. Cấu Hình Database

Backend đọc cấu hình từ:

```text
server/.env
```

Mẫu cấu hình đang dùng:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=1433
DB_NAME=huyperfume
DB_USER=
DB_PASSWORD=
```

Nếu SQL Server của bạn là named instance, ví dụ `localhost\SQLEXPRESS`, sửa thành:

```env
DB_HOST=localhost\SQLEXPRESS
DB_PORT=
DB_NAME=huyperfume
DB_USER=
DB_PASSWORD=
```

Nếu dùng SQL Authentication:

```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=huyperfume
DB_USER=sa
DB_PASSWORD=your_password
```

## 4. Import Database

File database chính:

```text
database_setup.sql
```

Lưu ý quan trọng: file này có đoạn drop table trước khi seed dữ liệu. Chỉ chạy khi bạn tạo database mới, hoặc đã backup dữ liệu hiện tại.

Cách 1, dùng SQL Server Management Studio:

1. Mở SQL Server Management Studio.
2. Kết nối vào SQL Server local.
3. Mở file `database_setup.sql`.
4. Bấm Execute.
5. Kiểm tra database `huyperfume` đã có bảng `products`, `users`, `orders`, `order_items`, `brand`, `categories`, `wishlist`.

Cách 2, dùng `sqlcmd` với Windows Authentication:

```bat
sqlcmd -S localhost -E -i database_setup.sql
```

Nếu dùng SQL Server Authentication:

```bat
sqlcmd -S localhost -U sa -P your_password -i database_setup.sql
```

## 5. Cài Dependency

Chạy tại root project:

```bat
npm.cmd install
npm.cmd install --prefix server
npm.cmd install --prefix frontend
```

Hoặc dùng VS Code:

1. Mở Command Palette.
2. Chọn `Tasks: Run Task`.
3. Chạy task `Install active app dependencies`.

## 6. Cấu Hình Frontend API

Frontend đọc cấu hình từ:

```text
frontend/.env
```

Nội dung hiện tại:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_API_PROXY_TARGET=http://localhost:4000
```

Với backend Express hiện tại, giữ như trên.

Nếu sau này bạn chạy backend Java Servlet cũ ở Tomcat context `/ThePerfumeShop`, có thể đổi:

```env
VITE_API_BASE_URL=http://localhost:8080/ThePerfumeShop
VITE_API_PROXY_TARGET=http://localhost:8080/ThePerfumeShop
```

## 7. Chạy Backend

Chạy riêng backend:

```bat
npm.cmd run dev --prefix server
```

Backend sẽ chạy tại:

```text
http://localhost:4000
```

Test health API:

```text
http://localhost:4000/api/health
```

Test products API:

```text
http://localhost:4000/api/products?page=1&size=12
```

Test product detail:

```text
http://localhost:4000/api/products/53
```

## 8. Chạy Frontend User

Chạy riêng frontend user:

```bat
npm.cmd run dev:user --prefix frontend
```

URL:

```text
http://localhost:5177
```

Các URL nên test:

```text
http://localhost:5177/
http://localhost:5177/products
http://localhost:5177/products/53
http://localhost:5177/login
http://localhost:5177/cart
http://localhost:5177/orders
```

## 9. Chạy Frontend Admin

Chạy riêng frontend admin:

```bat
npm.cmd run dev:admin --prefix frontend
```

URL:

```text
http://localhost:5178
```

Các URL nên test:

```text
http://localhost:5178/
http://localhost:5178/products
http://localhost:5178/orders
http://localhost:5178/users
```

## 10. Chạy Toàn Bộ App

Chạy backend, frontend user và frontend admin cùng lúc:

```bat
npm.cmd run dev
```

Hoặc trong VS Code:

1. Mở Command Palette.
2. Chọn `Tasks: Run Task`.
3. Chọn `Run active app`.

Hoặc dùng Debug:

1. Mở tab Run and Debug.
2. Chọn `Start Full App (F5)`.
3. Bấm F5.

## 11. Tài Khoản Test

Admin mẫu:

```text
Email: admin@huyperfume.com
Password: admin123
```

Nếu tài khoản cũ dùng mật khẩu MD5 từ legacy, backend hiện tại vẫn có logic verify MD5 và bcrypt.

## 12. Checklist Test Sau Khi Chạy

Test user:

- Trang chủ load được sản phẩm thật từ backend.
- Trang sản phẩm có danh sách nước hoa.
- Trang chi tiết có đúng tên, giá, ảnh, tồn kho.
- Đăng nhập được.
- Thêm sản phẩm vào giỏ hàng sau khi đăng nhập.
- Cập nhật số lượng giỏ hàng.
- Thanh toán COD tạo được đơn hàng.
- Lịch sử đơn hàng load từ `/api/orders/history`.

Test admin:

- Đăng nhập bằng tài khoản admin.
- Mở dashboard admin.
- Xem danh sách sản phẩm.
- Xem danh sách đơn hàng.
- Cập nhật trạng thái đơn hàng.
- Xem danh sách người dùng.

## 13. Lỗi Thường Gặp

Nếu frontend không nhận dữ liệu:

- Kiểm tra backend đã chạy ở `http://localhost:4000`.
- Mở `http://localhost:4000/api/products?page=1&size=12`.
- Kiểm tra `frontend/.env` có `VITE_API_BASE_URL=http://localhost:4000`.
- Restart lại Vite sau khi sửa `.env`.

Nếu backend không chạy:

- Kiểm tra SQL Server đang bật.
- Kiểm tra `server/.env` đúng `DB_HOST`, `DB_PORT`, `DB_NAME`.
- Nếu dùng `localhost\SQLEXPRESS`, để `DB_PORT=` trống.
- Kiểm tra ODBC Driver 18 for SQL Server đã cài.

Nếu PowerShell chặn npm:

```bat
npm.cmd run dev
```

Thay vì:

```powershell
npm run dev
```

## 14. Nguyên Tắc Không Làm Mất Chức Năng Cũ

- Không xóa thư mục `legacy/`.
- Không import lại `database_setup.sql` lên database thật nếu chưa backup.
- Không đổi tên endpoint API nếu frontend/backend đang dùng ổn.
- Không hardcode dữ liệu sản phẩm giả khi backend đã có dữ liệu thật.
- Khi sửa React, ưu tiên sửa service/API mapper trước, tránh sửa rải rác trong component.
