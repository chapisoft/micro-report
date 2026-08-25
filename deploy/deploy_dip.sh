#!/usr/bin/env bash
# ==============================================================================
# Manual & Automated Deployment Script — Micro-Report Platform (DIP Server 99)
# Usage: 
#   ./deploy/deploy_dip.sh                          # Deploy toàn bộ hệ thống
#   ./deploy/deploy_dip.sh all                      # Deploy toàn bộ hệ thống
#   ./deploy/deploy_dip.sh report-backend           # Chỉ deploy lại Backend
#   ./deploy/deploy_dip.sh report-frontend          # Chỉ deploy lại Frontend
# ==============================================================================

set -e

TARGET_SERVICE="${1:-all}"
SKIP_BUILD="${2:-false}"

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=========================================================="
echo "🚀 BẮT ĐẦU QUY TRÌNH DEPLOY MICRO-REPORT LÊN SERVER DIP"
echo "   - Target Service: $TARGET_SERVICE"
echo "   - Project Name:   micro-report (Cố định 100% tránh xung đột)"
echo "=========================================================="

# 1. Kiểm tra & Khởi tạo Docker Network chung dip-network
echo "🔍 [1/6] Kiểm tra Docker network 'dip-network'..."
if ! docker network ls | grep -q "dip-network"; then
    echo "  ⚠️ Mạng 'dip-network' chưa tồn tại. Đang tự động khởi tạo..."
    docker network create dip-network
else
    echo "  ✅ Mạng 'dip-network' đã sẵn sàng."
fi

# 2. Tạo thư mục persistent trên Host cho Metadata DB
echo "🔍 [2/6] Tạo thư mục dữ liệu trên máy chủ..."
mkdir -p /home/dip/data/report_metadata_db 2>/dev/null || mkdir -p "$DEPLOY_DIR/.data/report_metadata_db"

# 3. Biên dịch Artifacts (Nếu không skip build)
if [ "$SKIP_BUILD" != "true" ]; then
    echo "🔍 [3/6] Biên dịch mã nguồn Backend & Frontend..."

    # 3.1. Build Backend
    if [ "$TARGET_SERVICE" = "all" ] || [ "$TARGET_SERVICE" = "report-backend" ]; then
        if [ -d "src/backend" ]; then
            echo "  ☕ [Backend] Biên dịch Spring Boot 3 Engine JAR..."
            (cd src/backend && chmod +x ./gradlew && ./gradlew bootJar -x test --no-daemon --parallel)
            echo "  ✅ Backend JAR build hoàn tất: src/backend/build/libs/"
        fi
    fi

    # 3.2. Build Frontend
    if [ "$TARGET_SERVICE" = "all" ] || [ "$TARGET_SERVICE" = "report-frontend" ]; then
        if [ -d "src/frontend" ]; then
            echo "  🖥️ [Frontend] Đóng gói Next.js 14 Standalone..."
            (cd src/frontend && (npm ci || npm install) && npm run build)
            echo "  ✅ Frontend Standalone build hoàn tất: src/frontend/.next/standalone"
        fi
    fi
else
    echo "🔍 [3/6] Bỏ qua bước biên dịch (SKIP_BUILD=true)..."
fi

# 4. Cập nhật Nginx Gateway Virtual Host nếu có
echo "🔍 [4/6] Đồng bộ cấu hình Nginx Gateway..."
if [ -f "deploy/nginx/host-report-vhost.conf" ] && [ -d "/home/dip/dip/deploy/gateway/config/conf.d" ]; then
    cp deploy/nginx/host-report-vhost.conf /home/dip/dip/deploy/gateway/config/conf.d/micro-report.conf 2>/dev/null || true
    NGINX_ID=$(docker ps -q --filter 'name=gateway_stack_nginx' 2>/dev/null || true)
    if [ -n "$NGINX_ID" ]; then
        docker exec "$NGINX_ID" nginx -t && docker exec "$NGINX_ID" nginx -s reload 2>/dev/null || true
    fi
fi

# 5. Khởi chạy Docker Compose (Luôn cố định -p micro-report)
echo "🔍 [5/6] Khởi chạy Docker Compose Containers..."
if [ "$TARGET_SERVICE" = "all" ]; then
    docker compose -f deploy/docker-compose.dip.yml -p micro-report up -d --build --remove-orphans
else
    docker compose -f deploy/docker-compose.dip.yml -p micro-report up -d --build --no-deps "$TARGET_SERVICE"
fi

# 6. Kiểm tra trạng thái và Healthcheck
echo "🔍 [6/6] Kiểm tra trạng thái sức khỏe sau deploy..."
sleep 4

if [ -f "scripts/check_health.sh" ]; then
    ./scripts/check_health.sh 8088 3008 || true
fi

echo "=========================================================="
echo "✅ DEPLOY THỦ CÔNG HOÀN TẤT!"
echo "   - Backend API:       https://rpe.microtec.vn (Port 8088)"
echo "   - Frontend UI:       https://rpf.microtec.vn (Port 3008)"
echo "   - Swagger UI:        https://rpe.microtec.vn/swagger-ui.html"
echo "=========================================================="

# Gửi thông báo Telegram
if [ -f "scripts/notify_telegram.sh" ]; then
    ./scripts/notify_telegram.sh "🚀 *DEPLOY THỦ CÔNG HOÀN TẤT TRÊN SERVER 99!*
• Target: ${TARGET_SERVICE}
• Project Name: micro-report
• Backend: https://rpe.microtec.vn
• Frontend: https://rpf.microtec.vn" "SUCCESS" 2>/dev/null || true
fi
