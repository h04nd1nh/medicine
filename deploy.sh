#!/bin/bash
set -e

echo "========================================="
echo "  Deploy Hoan Dinh Medicine App"
echo "========================================="

# Cài pm2 nếu chưa có
if ! command -v pm2 &> /dev/null; then
  echo "[1/6] Cài pm2..."
  npm install -g pm2
else
  echo "[1/6] pm2 đã có"
fi

# Build backend
echo "[2/6] Cài dependencies backend..."
cd backend
npm install
echo "[3/6] Build backend..."
npm run build
cd ..

# Build frontend
echo "[4/6] Cài dependencies frontend..."
cd frontend
pnpm install --ignore-scripts
echo "[5/6] Build frontend..."
NUXT_PUBLIC_API_BASE=http://103.57.221.26:3001 NUXT_TELEMETRY_DISABLED=1 TOKIO_WORKER_THREADS=1 pnpm build
cd ..

# Khởi động với pm2
echo "[6/6] Khởi động ứng dụng..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "========================================="
echo "  Deploy thành công!"
echo "  Frontend: http://103.57.221.26:3000"
echo "  Backend:  http://103.57.221.26:3001"
echo "========================================="
echo ""
echo "Lệnh hữu ích:"
echo "  pm2 status        - Xem trạng thái"
echo "  pm2 logs           - Xem logs realtime"
echo "  pm2 logs backend   - Xem logs backend"
echo "  pm2 logs frontend  - Xem logs frontend"
echo "  pm2 restart all    - Restart tất cả"
echo "  pm2 stop all       - Dừng tất cả"
