#!/bin/bash
set -e

echo "=== 1. Cài Node 20, Nginx, PM2 ==="
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
sudo apt install -y nginx
sudo npm i -g pm2

echo "=== 2. Build backend ==="
cd "$(dirname "$0")/backend"
npm ci
npx tsc -p tsconfig.build.json
if [ ! -f dist/src/main.js ]; then
  echo "LỖI: Build thất bại - dist/src/main.js không tồn tại!"
  exit 1
fi
echo "Build OK: dist/src/main.js đã tạo thành công"

echo "=== 3. Khởi động backend bằng PM2 ==="
pm2 delete medicine-backend 2>/dev/null || true
pm2 start dist/src/main.js --name medicine-backend
pm2 save

echo "=== 4. Cấu hình Nginx ==="
WEBAPP_PATH="$(dirname "$0")/webapp"
WEBAPP_PATH=$(cd "$WEBAPP_PATH" && pwd)

sudo tee /etc/nginx/sites-available/medicine > /dev/null <<NGINX
server {
    listen 80;
    server_name _;

    root ${WEBAPP_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ ^/(patients|examinations|auth|meridian|admins)(/.*)?$ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/medicine /etc/nginx/sites-enabled/medicine
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 5. PM2 auto-start khi reboot ==="
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
pm2 save

echo ""
echo "=== XONG! ==="
echo "Webapp: http://$(hostname -I | awk '{print $1}')"
echo "Backend PM2: pm2 status / pm2 logs medicine-backend"
