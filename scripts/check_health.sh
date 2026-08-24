#!/usr/bin/env bash
# ==============================================================================
# Health Check & Smoke Test Script — Micro-Report Engine
# Usage: ./scripts/check_health.sh [backend-port] [frontend-port]
# ==============================================================================

BACKEND_PORT="${1:-8088}"
FRONTEND_PORT="${2:-3008}"

BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

echo "================================================================="
echo "🔍 KIỂM TRA TRẠNG THÁI SỨC KHỎE MICRO-REPORT"
echo "   - Backend URL:  $BACKEND_URL"
echo "   - Frontend URL: $FRONTEND_URL"
echo "================================================================="

# 1. Kiểm tra Backend Actuator Health
echo -n "1. Backend Actuator Health: "
BE_HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health" 2>/dev/null || echo "000")
if [ "$BE_HEALTH_CODE" = "200" ]; then
    echo "✅ [200 OK]"
else
    echo "⚠️ [Mã $BE_HEALTH_CODE] Không phản hồi trên cổng $BACKEND_PORT"
fi

# 2. Kiểm tra Swagger UI & OpenAPI Specification
echo -n "2. Backend OpenAPI Docs:   "
SWAGGER_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/v3/api-docs" 2>/dev/null || echo "000")
if [ "$SWAGGER_CODE" = "200" ]; then
    echo "✅ [200 OK]"
else
    echo "⚠️ [Mã $SWAGGER_CODE]"
fi

# 3. Kiểm tra Frontend Next.js Web App
echo -n "3. Frontend Web Builder:   "
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FE_CODE" = "200" ] || [ "$FE_CODE" = "302" ] || [ "$FE_CODE" = "307" ] || [ "$FE_CODE" = "308" ]; then
    echo "✅ [Mã $FE_CODE OK]"
else
    echo "⚠️ [Mã $FE_CODE] Không phản hồi trên cổng $FRONTEND_PORT"
fi

# 4. Kiểm tra trạng thái Docker Containers nếu Docker đang chạy
echo ""
echo "📊 Trạng thái các Docker Containers (micro-report):"
docker ps --filter "name=micro-report-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  (Docker daemon không khả dụng hoặc chưa khởi chạy container)"

echo "================================================================="

if [ "$BE_HEALTH_CODE" != "200" ] && [ "$FE_CODE" != "200" ]; then
    echo "⚠️ Lưu ý: Nếu đang chạy trên máy local dev, kiểm tra cổng 8080 (backend) và 3000 (frontend)."
fi
