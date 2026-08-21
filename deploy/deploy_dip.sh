#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY MICRO-REPORT LÊN SERVER DIP"
echo "=========================================================="

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"

cd "$ROOT_DIR"

# 1. Kiểm tra Docker Network
echo "🔍 [1/4] Kiểm tra Docker network 'dip-network'..."
if ! docker network ls | grep -q "dip-network"; then
    echo "  ⚠️ Mạng 'dip-network' chưa tồn tại. Đang tự động khởi tạo..."
    docker network create dip-network
else
    echo "  ✅ Mạng 'dip-network' đã sẵn sàng."
fi

# 2. Tạo thư mục lưu trữ data nếu chưa có
echo "🔍 [2/4] Tạo thư mục dữ liệu trên server..."
mkdir -p /home/dip/data/report_metadata_db 2>/dev/null || mkdir -p "$DEPLOY_DIR/.data/report_metadata_db"

# 3. Build và triển khai Docker Compose
echo "🔍 [3/4] Build và khởi chạy Docker Compose Containers..."
docker compose -f deploy/docker-compose.dip.yml up -d --build --remove-orphans

# 4. Kiểm tra trạng thái và Healthcheck
echo "🔍 [4/4] Kiểm tra trạng thái containers..."
sleep 5
docker compose -f deploy/docker-compose.dip.yml ps

echo "=========================================================="
echo "✅ DEPLOY HOÀN TẤT!"
echo "   - Backend API:       http://localhost:8088/swagger-ui.html"
echo "   - Frontend UI:       http://localhost:3008/reports/builder"
echo "   - Standalone Viewer: http://localhost:3008/embed/reports/viewer"
echo "=========================================================="
