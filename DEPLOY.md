# 🚀 Hướng dẫn Deploy lên VPS Linux

## Yêu cầu

- VPS Linux (Ubuntu 22.04+)
- Docker & Docker Compose đã cài
- Git

## 1. Cài Docker (nếu chưa có)

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Logout rồi login lại để apply quyền docker

# Kiểm tra
docker --version
docker compose version
```

## 2. Clone & cấu hình

```bash
# Clone repo
git clone <repo-url> ~/medicine
cd ~/medicine

# Tạo file .env ở root (cho docker-compose)
cp .env.example .env
# Sửa VPS_HOST thành IP hoặc domain thật
nano .env

# Tạo file .env cho backend (DB, JWT, ...)
cp backend/.env.example backend/.env
nano backend/.env
```

### File `.env` (root) — cho Docker Compose:
```env
VPS_HOST=103.57.221.26
```

### File `backend/.env` — cho NestJS:
```env
APP_PORT=3001
FRONTEND_URL=http://103.57.221.26

HOST=your-db-host
DB_PORT=5432
USER=your-db-user
PASSWORD=your-db-password
DATABASE_NAME=your-db-name
CA_CERTIFICATE="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

JWT_SECRET=your-strong-secret-key
```

## 3. Build & chạy

```bash
cd ~/medicine

# Build và chạy tất cả
docker compose up -d --build

# Xem trạng thái
docker compose ps

# Xem logs
docker compose logs -f
```

## 4. Truy cập

| Service  | URL                          |
|----------|------------------------------|
| Frontend | `http://<VPS_IP>`            |
| API      | `http://<VPS_IP>/api`        |

## 5. Lệnh quản lý

```bash
# Xem logs từng service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Restart
docker compose restart

# Dừng
docker compose down

# Cập nhật code mới
git pull
docker compose up -d --build

# Xóa sạch (bao gồm images)
docker compose down --rmi all
```

## 6. Kiến trúc

```
Internet → :80 (Nginx)
              ├── /api/* → backend:3001 (NestJS)
              └── /*     → frontend:3000 (Nuxt)
```

- **Nginx** là entry point duy nhất (port 80)
- Backend & Frontend chạy internal, không expose port ra ngoài
- Backend đọc env từ `backend/.env`
- `VPS_HOST` trong `.env` root dùng cho docker-compose build args
