# Trình bày bài: Web bán nước hoa + Thanh toán MoMo (Java + Node song song)

## 1. Mở đầu (30 giây)

- Đề tài: Website thương mại điện tử **Huy Perfume** (JSP/Servlet, MySQL).
- Chức năng chính: xem sản phẩm, giỏ hàng, đặt hàng, **thanh toán MoMo (sandbox)**.
- Điểm đặc biệt: **Ứng dụng Java chạy trên Tomcat (NetBeans)** và **server Node.js** chạy **song song** để xử lý API MoMo giống demo chuẩn (ký HMAC, gọi `create`).

---

## 2. Kiến trúc (vẽ lên bảng)

```
[Trình duyệt] 
    → Tomcat :8080 (Servlet/JSP)
         → Lưu đơn hàng MySQL
         → Nếu chọn MoMo: HTTP POST JSON → [Node :5000 /payment]
              → Node ký request + gọi https://test-payment.momo.vn/...
              → Trả JSON có payUrl
         → Servlet redirect người dùng → [Cổng thanh toán MoMo]
    ← Sau khi thanh toán, MoMo redirect về /momo-return → trang thành công
```

- **Java**: nghiệp vụ đơn hàng, session, redirect.
- **Node**: lớp “proxy” giống file `momo/server.js` trong clip/demo (Express + axios + crypto).

---

## 3. Cách chạy khi demo (2 cửa sổ)

| Bước | Việc làm |
|------|-----------|
| 1 | Mở **NetBeans** → Run project → Tomcat (vd: `http://localhost:8080/BaiThiCuoiKi`) |
| 2 | Mở **CMD / PowerShell** → `cd` vào thư mục `momo-node-proxy` trong project |
| 3 | Lần đầu: `npm install` |
| 4 | Mỗi lần demo: `npm start` (hoặc `node server.js`) → thấy dòng `[MoMo proxy] http://127.0.0.1:5000` |

**Lưu ý:** Nếu Node không chạy, bấm thanh toán MoMo sẽ lỗi (Java không gọi được `127.0.0.1:5000`). Hoặc đổi trong `MomoConfig.java`: `USE_NODE_PROXY = false` để dùng **Java thuần** (không cần Node).

---

## 4. Cấu hình trong code (chỉ nói miệng)

- `data/utils/MomoConfig.java`: `USE_NODE_PROXY`, `NODE_PAYMENT_URL`, key sandbox MoMo.
- `CheckoutServlet`: sau khi lưu đơn → gọi `MomoNodeClient` hoặc `MomoPaymentHelper`.
- `MomoReturnServlet` (`/momo-return`): nhận kết quả từ MoMo, cập nhật trạng thái đơn.

---

## 5. Kết luận

- Đã tích hợp **payment gateway** theo hướng **tách lớp**: web Java + service thanh toán (Node hoặc thuần Java).
- Sandbox MoMo **không** trừ tiền thật; production cần đăng ký merchant và đổi key/endpoint.

---

## 6. Câu hỏi thường gặp (giảng viên)

- **Vì sao có Node?** Để tái hiện đúng demo/clip (Express), dễ debug log; có thể thay bằng chỉ Java (`USE_NODE_PROXY = false`).
- **IPN MoMo?** MoMo gọi URL công khai; localhost cần **ngrok** nếu muốn IPN thật.

---

## 7. Thử nhanh bằng Postman (Node phải đang chạy)

1. **Trước Postman:** trong `momo-node-proxy` chạy `npm start` → terminal phải in `GET / | POST /payment`.
2. **Trình duyệt:** mở `http://127.0.0.1:5000/` — nếu **không** thấy JSON `ok: true` thì Postman cũng **không** kết nối được (Node chưa chạy / sai port / firewall).
3. **Postman:**
   - Method **POST**
   - URL **`http://127.0.0.1:5000/payment`** (dùng **http**, không phải https)
   - Tab **Headers:** `Content-Type` = `application/json`
   - Tab **Body** → **raw** → **JSON**, ví dụ: `{}` hoặc `{"amount":"10000","orderId":"TEST001"}`
4. **Lỗi thường gặp:**

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **Could not get response** / **ECONNREFUSED** | Chưa `npm start` hoặc port khác 5000 |
| **404** | Sai URL (thiếu `/payment` hoặc gõ nhầm `localhost:8080`) |
| **500** + JSON `detail` | Xem `detail` từ MoMo (key sandbox / mạng); xem log cửa sổ Node |

Nếu **không cần** test Node: đặt `USE_NODE_PROXY = false` trong `MomoConfig.java` và thử thanh toán MoMo **trực tiếp từ web** (Tomcat).

