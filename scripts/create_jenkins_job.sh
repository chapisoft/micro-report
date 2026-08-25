#!/usr/bin/env bash
# ==============================================================================
# Jenkins Job Provisioning Script — Micro-Report Platform
# Usage: ./scripts/create_jenkins_job.sh [JENKINS_USER] [JENKINS_API_TOKEN]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

JENKINS_URL="${JENKINS_URL:-http://jenkins.dip.io.vn/jenkins}"
JOB_NAME="Micro-Report"
CONFIG_FILE="$ROOT_DIR/deploy/ci-cd/jenkins/job-config.xml"

JENKINS_USER="${1:-$JENKINS_USER}"
JENKINS_API_TOKEN="${2:-$JENKINS_API_TOKEN}"

echo "================================================================="
echo "🚀 KHỞI TẠO JENKINS JOB CHO MICRO-REPORT"
echo "   - Jenkins URL: $JENKINS_URL"
echo "   - Job Name:    $JOB_NAME"
echo "================================================================="

if [ -z "$JENKINS_USER" ] || [ -z "$JENKINS_API_TOKEN" ]; then
    echo "⚠️ Hướng dẫn sử dụng:"
    echo "   ./scripts/create_jenkins_job.sh <JENKINS_USER> <JENKINS_API_TOKEN>"
    echo ""
    echo "👉 Hoặc cấu hình biến môi trường JENKINS_USER và JENKINS_API_TOKEN."
    echo "👉 Hoặc tạo thủ công trên giao diện Web UI theo tài liệu hướng dẫn bên dưới."
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Không tìm thấy tệp cấu hình: $CONFIG_FILE"
    exit 1
fi

# 1. Lấy Jenkins Crumb (CSRF protection)
echo "🔍 1. Lấy CSRF Crumb từ Jenkins..."
CRUMB=$(curl -s -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" "${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,':',//crumb)" 2>/dev/null || echo "")

HEADER_CRUMB=()
if [ -n "$CRUMB" ]; then
    HEADER_CRUMB=(-H "$CRUMB")
    echo "  ✅ Crumb: OK"
else
    echo "  ℹ️ Jenkins không bật CrumbIssuer hoặc CSRF protection."
fi

# 2. Kiểm tra xem Job đã tồn tại chưa
echo "🔍 2. Kiểm tra trạng thái Job trên máy chủ..."
CHECK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" "${JENKINS_URL}/job/${JOB_NAME}/config.xml" 2>/dev/null || echo "000")

if [ "$CHECK_STATUS" = "200" ]; then
    echo "  ⚠️ Job '$JOB_NAME' đã tồn tại. Đang cập nhật cấu hình mới..."
    curl -s -X POST -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
        "${HEADER_CRUMB[@]}" \
        -H "Content-Type: application/xml" \
        --data-binary @"$CONFIG_FILE" \
        "${JENKINS_URL}/job/${JOB_NAME}/config.xml"
    echo "  ✅ Đã cập nhật Job '$JOB_NAME' thành công!"
else
    echo "  ⚙️ Job chưa tồn tại. Đang tạo mới Job '$JOB_NAME'..."
    CREATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
        "${HEADER_CRUMB[@]}" \
        -H "Content-Type: application/xml" \
        --data-binary @"$CONFIG_FILE" \
        "${JENKINS_URL}/createItem?name=${JOB_NAME}" 2>/dev/null || echo "000")

    if [ "$CREATE_STATUS" = "200" ]; then
        echo "  ✅ Đã tạo mới Job '$JOB_NAME' thành công!"
    else
        echo "  ⚠️ Phản hồi từ Jenkins API: HTTP $CREATE_STATUS"
    fi
fi

echo "================================================================="
echo "👉 Truy cập Job tại: ${JENKINS_URL}/job/${JOB_NAME}/"
echo "================================================================="
