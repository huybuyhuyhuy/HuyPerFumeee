# Huy Perfume

Dự án chính hiện chỉ giữ hai phần chạy cần thiết:

- `frontend/`: giao diện React + Vite cho user và admin.
- `backend/`: API Express kết nối SQL Server.

Các file SQL ở thư mục gốc dùng để tạo hoặc import dữ liệu ban đầu cho database `huyperfume`.

## Cài đặt

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Tạo file môi trường nếu máy chưa có:

- `backend/.env` từ `backend/.env.example`
- `frontend/.env` từ `frontend/.env.example`

## Chạy local

```bash
npm run dev
```

Hoặc trên Windows có thể chạy:

```bat
run-all.bat
```

Mặc định:

- User frontend: `http://localhost:5177/`
- Admin frontend: `http://localhost:5178/`
- Backend API: `http://localhost:4000/`

## Database

- Database: `huyperfume`
- SQL Server local: cấu hình trong `backend/.env`
- Script tạo dữ liệu ban đầu: `database_setup.sql`
- Script import bổ sung nếu cần: `database_setup_huyperfume_import.sql`

Không chạy lại script seed nếu database đã có dữ liệu thật, vì có thể ghi đè dữ liệu đang dùng.

## Migration

Chạy migration backend khi cần:

```powershell
cd backend
npm.cmd run db:migrate:auth
```

## Ghi chú

- Không commit secret thật trong file `.env`.
- `node_modules/`, `dist/`, `.runtime/`, ảnh chụp test và profile Chrome test là dữ liệu sinh ra khi chạy dự án, không cần nộp bài.
