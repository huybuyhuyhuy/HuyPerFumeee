# MIGRATION_PLAN

## 1. Mục tiêu

Dự án hiện tại là một hệ thống ecommerce bán nước hoa xây dựng bằng **Java Servlet/JSP**. Mục tiêu của tài liệu này là phân tích hiện trạng để migrate dần sang:

- **Node.js + Express** cho backend
- **React + Vite** cho frontend

Tài liệu này **chỉ phân tích**, không sửa code và không tạo ra backend/frontend mới.

---

## 2. Kết luận nhanh về kiến trúc hiện tại

### Stack đang hoạt động chính
- **Frontend hiện tại**: React + Vite trong thư mục `frontend/`
- **Backend hiện tại**: Express API trong thư mục `server/`
- **Legacy / nguồn tham khảo cũ**: Java Servlet/JSP nằm trong `legacy/servlet-jsp/`
- **Database**: SQL Server

### Tình trạng source
Repo đang chứa nhiều thế hệ code song song:
1. Code legacy Java Servlet/JSP
2. Code Express API mới
3. Code React/Vite mới
4. Một số thư mục/build artifact và tài nguyên cũ

Điều này có nghĩa là khi migrate phải tránh nhầm lẫn giữa:
- hệ thống legacy cũ,
- hệ thống Express mới,
- và các tài nguyên dùng chung như ảnh, SQL seed, assets.

---

## 3. Phân tích cấu trúc thư mục

### Cấu trúc chính ở root
- `frontend/` — React/Vite frontend
- `server/` — Express backend mới
- `legacy/` — toàn bộ code cũ để tham khảo
- `database_setup.sql` — script seed / tạo schema SQL Server
- `run-all.bat` — script chạy đồng thời
- `web/`, `src/`, `nbproject/`, `build/`, `dist/`, `momo-node-proxy/` — dấu vết của các giai đoạn cũ hoặc artifact build

### Ý nghĩa
- `frontend/` và `server/` là đường chạy hiện tại cần ưu tiên khi migrate tiếp.
- `legacy/servlet-jsp/` là nguồn “sự thật nghiệp vụ” tốt nhất cho các luồng cũ như auth, cart, checkout, wishlist, admin.
- `database_setup.sql` là cơ sở quan trọng để đối chiếu schema và dữ liệu mẫu.

---

## 4. Xác định module và file liên quan

> Phần này liệt kê các file Java/JSP legacy liên quan từng module để phục vụ migrate an toàn.

### 4.1 Auth
#### Chức năng
- Đăng nhập
- Đăng ký
- Đăng xuất
- Hồ sơ tài khoản
- Quên mật khẩu / reset mật khẩu

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/LoginServlet.java`
- `legacy/servlet-jsp/src/java/controller/RegisterServlet.java`
- `legacy/servlet-jsp/src/java/controller/LogoutServlet.java`
- `legacy/servlet-jsp/src/java/controller/ProfileServlet.java`
- `legacy/servlet-jsp/src/java/controller/ForgotPasswordServlet.java`
- `legacy/servlet-jsp/src/java/data/dao/UserDao.java`
- `legacy/servlet-jsp/src/java/data/impl/UserImpl.java`
- `legacy/servlet-jsp/src/java/data/utils/PasswordUtils.java`
- `legacy/servlet-jsp/src/java/model/User.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/views/login.jsp`
  - `legacy/servlet-jsp/web/views/register.jsp`
  - `legacy/servlet-jsp/web/views/profile.jsp`
  - `legacy/servlet-jsp/web/views/forgot-password.jsp`

#### Luồng hiện tại
- `LoginServlet` gọi `Database.getUsersDao().findUser(emailphone, password)` để xác thực.
- `RegisterServlet` validate đầu vào, kiểm tra trùng email/phone rồi insert user.
- `ForgotPasswordServlet` xác nhận email, sau đó cập nhật password mới.
- `ProfileServlet` đọc user từ session và cập nhật thông tin người dùng.
- `LogoutServlet` xoá session.

#### Điểm lưu ý khi migrate
- Phần auth hiện phụ thuộc chặt vào session và `User` object trong session.
- Legacy có logic nâng cấp mật khẩu từ MD5 sang bcrypt.
- Nếu migrate sai sẽ dễ mất tương thích giữa user cũ và user mới.

---

### 4.2 Product
#### Chức năng
- Danh sách sản phẩm
- Chi tiết sản phẩm
- Lọc theo danh mục / thương hiệu / giá
- Tìm kiếm
- Sản phẩm nổi bật
- Chatbot tra cứu sản phẩm

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/HomeServlet.java`
- `legacy/servlet-jsp/src/java/controller/ProductDetailServlet.java`
- `legacy/servlet-jsp/src/java/controller/ProductApiServlet.java`
- `legacy/servlet-jsp/src/java/controller/AllProductsServlet.java`
- `legacy/servlet-jsp/src/java/controller/DecantProductServlet.java`
- `legacy/servlet-jsp/src/java/controller/RandomProductsServlet.java`
- `legacy/servlet-jsp/src/java/data/dao/ProductsDao.java`
- `legacy/servlet-jsp/src/java/data/impl/ProductsImpl.java`
- `legacy/servlet-jsp/src/java/model/Products.java`
- `legacy/servlet-jsp/src/java/controller/ImageServlet.java`
- `legacy/servlet-jsp/src/java/controller/ProductChatbotServlet.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/views/home.jsp`
  - `legacy/servlet-jsp/web/views/product-detail.jsp`
  - `legacy/servlet-jsp/web/views/all-products.jsp`
  - `legacy/servlet-jsp/web/views/knowledge-detail.jsp` và `knowledge.jsp` nếu có content gắn sản phẩm

#### Luồng hiện tại
- `HomeServlet` là trung tâm load sản phẩm, phân trang, lọc, sort.
- `ProductDetailServlet` lấy sản phẩm theo id, thương hiệu và scent structure.
- `ProductApiServlet` cung cấp JSON cho frontend / AJAX.
- `ImageServlet` phục vụ ảnh sản phẩm động hoặc ảnh từ DB.
- `ProductChatbotServlet` trả lời câu hỏi về sản phẩm bằng JSON.

#### Điểm lưu ý khi migrate
- Module product đang là nguồn dữ liệu trung tâm cho gần như toàn bộ ecommerce.
- Quan hệ với category/brand/image/decant/stock/price rất quan trọng.
- Nếu migrate sai mapping field sẽ ảnh hưởng toàn site.

---

### 4.3 Cart
#### Chức năng
- Thêm vào giỏ
- Cập nhật số lượng
- Xóa sản phẩm
- Xóa toàn bộ giỏ
- Tự động add cart sau login từ target_id

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/CartServlet.java`
- `legacy/servlet-jsp/src/java/data/utils/CartUtils.java`
- `legacy/servlet-jsp/src/java/model/Products.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/views/cart.jsp`
  - `legacy/servlet-jsp/web/inc/_cart.jsp`

#### Luồng hiện tại
- Cart được lưu trong session.
- `CartUtils` xử lý add item.
- `CartServlet` xử lý update/delete/clear.
- Sau login có thể tự add lại sản phẩm nhờ `target_id`.

#### Điểm lưu ý khi migrate
- Session cart là một trong những luồng dễ lỗi nhất khi chuyển từ JSP sang API.
- Cần giữ format dữ liệu cart ổn định giữa frontend và backend.

---

### 4.4 Checkout
#### Chức năng
- Xác nhận đơn hàng
- Thanh toán
- Giao diện success / success popup
- Tích hợp các luồng payment cũ

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/CheckoutServlet.java`
- `legacy/servlet-jsp/src/java/data/utils/Constants.java`
- `legacy/servlet-jsp/src/java/data/utils/CartUtils.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/views/cart.jsp`
  - `legacy/servlet-jsp/web/inc/success.jsp`
  - `legacy/servlet-jsp/web/views/profile.jsp` nếu có luồng chọn địa chỉ/đặt hàng

#### Luồng hiện tại
- Một số phần checkout có thể được tích hợp trong cart hoặc các servlet payment khác.
- Trong legacy và các file phụ trợ có dấu vết của MoMo / ZaloPay.

#### Điểm lưu ý khi migrate
- Checkout thường phụ thuộc cực mạnh vào order, cart, payment.
- Không tách checkout quá sớm khi chưa ổn định order/payment.

---

### 4.5 Order
#### Chức năng
- Tạo đơn hàng
- Lịch sử đơn hàng
- Chi tiết đơn hàng
- Admin cập nhật trạng thái đơn

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/OrderHistoryServlet.java`
- `legacy/servlet-jsp/src/java/controller/AdminOrderDetailServlet.java`
- `legacy/servlet-jsp/src/java/controller/UpdateOrderStatusServlet.java`
- `legacy/servlet-jsp/src/java/controller/CancelOrderServlet.java`
- `legacy/servlet-jsp/src/java/model/Products.java` và `User.java` thông qua quan hệ order item/user
- JSP giao diện:
  - `legacy/servlet-jsp/web/views/order-history.jsp`
  - `legacy/servlet-jsp/web/views/admin-order-detail.jsp` nếu tồn tại trong views cũ hoặc tương đương

#### Luồng hiện tại
- `OrderHistoryServlet` join `orders`, `order_items`, `products` để dựng lịch sử.
- Các servlet admin xử lý cập nhật trạng thái/hủy đơn.

#### Điểm lưu ý khi migrate
- Schema order/item là nghiệp vụ quan trọng, cần giữ ổn định id/foreign key/status.
- Nếu migrate sai dễ hỏng lịch sử mua hàng của user cũ.

---

### 4.6 Wishlist
#### Chức năng
- Thêm/xóa sản phẩm yêu thích
- Lấy danh sách wishlist

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/WishlistServlet.java`
- `legacy/servlet-jsp/src/java/data/dao/WishlistDao.java`
- `legacy/servlet-jsp/src/java/data/impl/WishlistImpl.java`
- `legacy/servlet-jsp/src/java/model/Products.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/inc/wishlist.jsp`

#### Luồng hiện tại
- Wishlist gắn với user đang login.
- Có hỗ trợ AJAX trả JSON `newSize`.
- Nếu chưa login, thêm wishlist sẽ redirect sang login với `target_id`.

#### Điểm lưu ý khi migrate
- Tương tác wishlist thường dùng chung với product detail/card.
- Cần đồng bộ behavior giữa frontend React và backend API.

---

### 4.7 Admin
#### Chức năng
- Dashboard
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý người dùng
- Phân quyền admin

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/AdminHomeServlet.java`
- `legacy/servlet-jsp/src/java/controller/AdminProductsServlet.java` nếu tồn tại trong legacy source đầy đủ hoặc tương đương qua các file add/edit/delete
- `legacy/servlet-jsp/src/java/controller/AddProductsServlet.java`
- `legacy/servlet-jsp/src/java/controller/EditProductServlet.java`
- `legacy/servlet-jsp/src/java/controller/DeleteProductsServlet.java`
- `legacy/servlet-jsp/src/java/controller/AdminUsersServlet.java` nếu có trong version cũ hoặc tương đương trong legacy views
- `legacy/servlet-jsp/src/java/controller/AdminOrdersServlet.java` nếu có trong version cũ hoặc tương đương
- `legacy/servlet-jsp/src/java/controller/UpdateOrderStatusServlet.java`
- `legacy/servlet-jsp/src/java/controller/AdminOrderDetailServlet.java`
- `legacy/servlet-jsp/src/java/filter/AdminFilter.java`
- JSP giao diện:
  - `legacy/servlet-jsp/web/inc/_admin.jsp`
  - `legacy/servlet-jsp/web/inc/add-products.jsp`
  - `legacy/servlet-jsp/web/inc/edit-products.jsp`
  - các view admin tương ứng

#### Luồng hiện tại
- `AdminFilter` bảo vệ route admin.
- `AddProductsServlet` upload ảnh và insert sản phẩm.
- `EditProductServlet` sửa sản phẩm.
- `DeleteProductsServlet` xóa sản phẩm.
- `UpdateOrderStatusServlet` cập nhật trạng thái đơn.

#### Điểm lưu ý khi migrate
- Admin là khu vực rủi ro cao vì liên quan CRUD trực tiếp vào DB.
- Cần migrate sau khi xong auth, product, order cơ bản.

---

### 4.8 Payment
#### Chức năng
- MoMo
- ZaloPay
- Return/IPN callback
- Helper tạo payment request

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/MomoIpnServlet.java`
- `legacy/servlet-jsp/src/java/controller/MomoReturnServlet.java`
- `legacy/servlet-jsp/src/java/controller/ZaloPayReturnServlet.java`
- `legacy/servlet-jsp/src/java/data/utils/MomoConfig.java`
- `legacy/servlet-jsp/src/java/data/utils/MomoPaymentHelper.java`
- `legacy/servlet-jsp/src/java/data/utils/MomoNodeClient.java`
- `legacy/servlet-jsp/src/java/data/utils/ZaloPayConfig.java`
- `legacy/servlet-jsp/src/java/data/utils/ZaloPayPaymentHelper.java`
- `legacy/servlet-jsp/src/java/data/utils/API.java`
- `legacy/servlet-jsp/src/java/controller/CheckoutServlet.java`
- `legacy/servlet-jsp/web/inc/success.jsp`

#### Luồng hiện tại
- Payment có dấu vết của nhiều gateway.
- Có callback return/IPN riêng cho từng cổng.

#### Điểm lưu ý khi migrate
- Đây là một trong các phần nguy hiểm nhất.
- Không nên migrate payment trước khi order/cart ổn định.
- Cần xem rõ cổng nào còn dùng thực tế và cổng nào chỉ là legacy.

---

### 4.9 AI / Chatbot
#### Chức năng
- Hỏi đáp sản phẩm
- Tra cứu giá, tồn kho, mùi hương, SKU, batch code
- Gợi ý sản phẩm theo ngân sách/danh mục

#### File liên quan
- `legacy/servlet-jsp/src/java/controller/ProductChatbotServlet.java`
- `legacy/servlet-jsp/web/assets/js/product-chatbox.js` nếu còn dùng ở UI cũ
- `legacy/servlet-jsp/src/java/data/dao/ProductsDao.java`
- `legacy/servlet-jsp/src/java/model/Products.java`

#### Luồng hiện tại
- Chưa phải AI thật theo nghĩa model bên ngoài.
- Đây là chatbot rule-based dựa vào query text + data sản phẩm từ DB.

#### Điểm lưu ý khi migrate
- Có thể tách module này sang Node khá sớm vì chủ yếu là logic đọc dữ liệu sản phẩm.
- Nhưng cần giữ tương thích query/response JSON để frontend không vỡ.

---

## 5. Database đang dùng

### Đang dùng gì
- **SQL Server**

### Bằng chứng
- File `database_setup.sql` có cú pháp SQL Server:
  - `IF DB_ID(N'huyperfume') IS NULL`
  - `GO`
  - `GETDATE()`
  - `BIT`, `NVARCHAR`, `DATETIME2`
- Backend hiện tại trong `server/src/db.js` cũng đang connect SQL Server bằng:
  - `mssql`
  - `msnodesqlv8`

### Các bảng chính trong `database_setup.sql`
- `categories`
- `brand`
- `users`
- `products`
- `orders`
- `order_items`
- `wishlist`

### Dữ liệu seed quan trọng
- Admin mẫu: `admin@huyperfume.com`
- Một số sản phẩm mẫu
- Thương hiệu mẫu
- Danh mục mẫu

---

## 6. Framework / thư viện đang dùng

### Legacy Java
- Servlet / JSP
- Jakarta Servlet API
- JDBC / DAO pattern
- Connection pool / driver qua các lớp trong `data/driver`
- JSP views + include fragments
- Multipart upload cho ảnh sản phẩm
- Password hashing utility
- Payment helper cho MoMo/ZaloPay

### Backend hiện tại trong `server/`
- Node.js
- Express
- CORS
- dotenv
- jsonwebtoken
- bcryptjs
- `mssql`
- `msnodesqlv8`
- `mysql2` vẫn xuất hiện nhưng hiện không phải backend chính theo README

### Frontend hiện tại trong `frontend/`
- React
- Vite
- React Router
- Bootstrap
- Custom CSS theme
- Axios qua service layer

---

## 7. Dependency quan trọng cần chú ý

### Legacy / Java
- JDBC driver SQL Server / MySQL lịch sử
- `PasswordUtils` cho hash/verify
- `CartUtils`
- `MomoPaymentHelper`, `ZaloPayPaymentHelper`
- `UnsplashImageService` / `UnsplashConfig`
- `AdminFilter`

### Backend Node hiện tại
- `express`
- `mssql`
- `msnodesqlv8`
- `jsonwebtoken`
- `bcryptjs`
- `cors`
- `dotenv`

### Frontend React
- `react`, `react-dom`
- `react-router-dom`
- `bootstrap`
- `axios` nếu dùng trong services

---

## 8. Luồng hoạt động hiện tại

### 8.1 Luồng người dùng
1. User mở home
2. `HomeServlet` legacy hoặc React frontend hiển thị sản phẩm
3. User xem chi tiết product
4. User thêm vào cart hoặc wishlist
5. User login/register
6. Nếu cần, user checkout
7. Order được tạo và lưu DB
8. User xem order history

### 8.2 Luồng admin
1. Admin login
2. `AdminFilter` kiểm tra quyền
3. Admin vào dashboard
4. Admin CRUD products
5. Admin xử lý orders/users

### 8.3 Luồng payment
1. Checkout
2. Chọn payment method
3. Gọi helper / gateway
4. Gateway return/IPN
5. Backend cập nhật trạng thái đơn

### 8.4 Luồng chatbot
1. Frontend gọi endpoint chatbot
2. Backend đọc dữ liệu products
3. Trả answer + suggestions JSON

---

## 9. Phần nguy hiểm nếu migrate sai

### 9.1 Auth
- Sai mapping password hash cũ/new
- Mất compatibility với user đã tồn tại
- Sai session/token flow

### 9.2 Product
- Sai field mapping `discount_price`, `is_decant`, `stock`, `image`
- Sai quan hệ `category` / `brand`
- Sai path ảnh làm site “trống” dù DB có dữ liệu

### 9.3 Cart / Checkout
- Cart session và target-id redirect rất dễ vỡ
- Sai xử lý quantity/stock
- Checkout phụ thuộc vào order + payment + auth

### 9.4 Order / Payment
- Cập nhật trạng thái sai sẽ làm lịch sử đơn hỏng
- Callback/IPN sai sẽ tạo đơn “treo” hoặc double update
- Thanh toán là vùng không nên migrate ẩu

### 9.5 Admin
- CRUD sai có thể ghi nhầm DB
- Migrate admin trước khi ổn định data layer rất rủi ro

### 9.6 Chatbot
- Nếu đổi schema response JSON làm frontend cũ vỡ
- Nếu quên cache/limit sẽ tăng tải DB

---

## 10. Đề xuất thứ tự migrate an toàn

### Giai đoạn 1 — Chuẩn hóa dữ liệu và hợp đồng API
Ưu tiên:
1. Chốt schema SQL Server hiện tại
2. Chốt model dữ liệu sản phẩm, user, order, wishlist
3. Định nghĩa API contract rõ ràng

### Giai đoạn 2 — Migrate các module ít rủi ro hơn
1. `product` read-only API
2. `wishlist`
3. `chatbot`
4. `profile` read/update cơ bản

### Giai đoạn 3 — Migrate auth
1. login
2. register
3. logout
4. forgot/reset password
5. token/session compatibility

### Giai đoạn 4 — Migrate cart & order cơ bản
1. cart session
2. add/update/delete item
3. checkout tạo order
4. order history

### Giai đoạn 5 — Migrate payment
1. chỉ khi order/cart đã ổn định
2. migrate từng gateway một
3. giữ callback/IPN song song nếu cần

### Giai đoạn 6 — Migrate admin
1. product CRUD
2. order management
3. user management
4. dashboard/statistics

### Giai đoạn 7 — Dọn legacy
1. loại bỏ JSP views còn sót
2. xóa code servlet không dùng
3. tách repo legacy riêng nếu cần

---

## 11. Khuyến nghị triển khai migrate

### Nên làm
- Migrate từng module nhỏ
- Giữ nguyên DB schema ban đầu càng lâu càng tốt
- Có lớp adapter/mapping cho response giữa legacy và new backend
- Test song song từng endpoint
- Giữ dữ liệu ảnh/product/brand/category không đổi trong giai đoạn đầu

### Không nên làm
- Rewrite toàn bộ cùng lúc
- Đổi endpoint hàng loạt một lần
- Đổi schema DB trước khi API ổn định
- Migrate payment trước auth/order
- Xóa legacy ngay khi chưa xong đối chiếu nghiệp vụ

---

## 12. Kết luận

Dự án này có thể migrate an toàn sang Node.js + Express + React/Vite, nhưng phải làm **theo từng lớp chức năng**. Phần rủi ro nhất là auth, cart, checkout, order và payment. Phần an toàn hơn để bắt đầu là product read API, wishlist và chatbot.

Nếu muốn, bước tiếp theo hợp lý nhất là lập **bản migration roadmap theo sprint** hoặc **map chi tiết từng endpoint legacy sang Express route mới**.
