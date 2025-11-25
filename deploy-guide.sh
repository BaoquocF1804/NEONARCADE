#!/bin/bash

set -euo pipefail

cat <<'EOT'
Neon Arcade Deployment Guide
============================

1. Chuẩn bị code
   - git pull origin master
   - npm install && (cd server && npm install)
   - npm run build (kiểm tra lỗi trước khi deploy)

2. Kiểm tra SSH
   - Đảm bảo bạn có quyền ssh root@207.148.79.36
   - Nếu bị "Permission denied" hãy add SSH key bằng: ssh-copy-id root@207.148.79.36

3. Deploy môi trường 8080
   - Từ thư mục dự án: ./deploy-8080.sh
   - Script sẽ: copy code, docker compose down, build + up -d
   - Nếu gặp lỗi container name bị trùng: ssh vào server và chạy `docker rm -f neon-arcade-backend-new neon-arcade-frontend-new`

4. Kiểm tra sau deploy
   - Mở http://207.148.79.36:8080
   - ssh root@207.148.79.36 và chạy `docker compose -f docker-compose-8080.yml ps`

5. Khắc phục sự cố thường gặp
   - Permission denied: thêm SSH key hoặc kiểm tra mật khẩu
   - Cổng 8080 bận: docker ps để kiểm tra port
   - Log backend: `docker logs -f neon-arcade-backend-new`
   - Log frontend: `docker logs -f neon-arcade-frontend-new`

Mẹo: Tạo file .env với biến CLIENT_ORIGIN / VITE_SOCKET_URL nếu cần cấu hình khác khi deploy.

EOT

