#!/usr/bin/env bash
# ==============================================================================
# Telegram Alerting & Notification Script — Micro-Report Platform
# Usage: ./scripts/notify_telegram.sh "MESSAGE_TEXT" [STATUS_TYPE: SUCCESS|FAILED|WARNING|INFO]
# ==============================================================================

set -e

# Load from .env if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$ROOT_DIR/deploy/.env" ]; then
    set -a
    [ -s "$ROOT_DIR/deploy/.env" ] && eval "$(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$ROOT_DIR/deploy/.env" || true)"
    set +a
elif [ -f "$ROOT_DIR/.env" ]; then
    set -a
    [ -s "$ROOT_DIR/.env" ] && eval "$(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$ROOT_DIR/.env" || true)"
    set +a
fi

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8694821173:AAFJ3XlvDpYRywzEiB54RSNjAdS62XPKZXA}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:--5397937309}"

RAW_MESSAGE="${1:-Thông báo từ hệ thống Micro-Report Engine}"
STATUS_TYPE="${2:-INFO}"
MESSAGE=$(printf '%b' "$RAW_MESSAGE")

# Icon mappings
case "$STATUS_TYPE" in
    "SUCCESS")
        ICON="✅"
        HEADER="[MICRO-REPORT] DEPLOYMENT / CI THÀNH CÔNG"
        ;;
    "FAILED")
        ICON="🚨"
        HEADER="[MICRO-REPORT] CẢNH BÁO LỖI / DEPLOY THẤT BẠI"
        ;;
    "WARNING")
        ICON="⚠️"
        HEADER="[MICRO-REPORT] CẢNH BÁO HỆ THỐNG"
        ;;
    *)
        ICON="ℹ️"
        HEADER="[MICRO-REPORT] THÔNG TIN HỆ THỐNG"
        ;;
esac

FORMATTED_TEXT="${ICON} *${HEADER}*
━━━━━━━━━━━━━━━━━━━━
${MESSAGE}
━━━━━━━━━━━━━━━━━━━━
📅 *Thời gian:* $(date '+%Y-%m-%d %H:%M:%S %Z')
🌐 *Máy chủ:* 210.211.102.99"

echo "Telegram Message: $FORMATTED_TEXT"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "⚠️ Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong môi trường / .env."
    exit 0
fi

# Send via Telegram Bot API with urlencode
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${FORMATTED_TEXT}" \
    -d "parse_mode=Markdown" || echo '{"ok":false,"description":"curl error"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Đã gửi thông báo Telegram thành công!"
else
    echo "⚠️ Phản hồi từ Telegram API: $RESPONSE"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${FORMATTED_TEXT}" >/dev/null 2>&1 || true
fi
