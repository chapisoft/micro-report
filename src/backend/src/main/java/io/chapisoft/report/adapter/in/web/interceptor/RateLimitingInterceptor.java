package io.chapisoft.report.adapter.in.web.interceptor;

import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final Map<String, TokenBucket> userBuckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String clientKey = resolveClientKey(request);
        TokenBucket bucket = userBuckets.computeIfAbsent(clientKey, k -> createNewBucket());

        if (bucket.tryConsume()) {
            return true;
        }

        log.warn("Rate limit exceeded for client key: [{}]", clientKey);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\""
                + ReportConstants.MSG_TOO_MANY_REQUESTS + "\"}");

        return false;
    }

    private String resolveClientKey(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        TenantContext ctx = TenantContext.get();
        if (ctx != null && ctx.getTenantId() != null) {
            String userId = (ctx.getUserId() != null && !ctx.getUserId().trim().isEmpty() && !ReportConstants.CREATED_BY_ANONYMOUS.equalsIgnoreCase(ctx.getUserId()))
                    ? ctx.getUserId().trim()
                    : clientIp;
            return ctx.getTenantId().trim() + "::" + userId;
        }

        String headerTenant = request.getHeader(ReportConstants.HEADER_TENANT_ID);
        if (headerTenant != null && !headerTenant.trim().isEmpty()) {
            return headerTenant.trim() + "::" + clientIp;
        }

        return clientIp;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.trim().isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.trim().isEmpty()) {
            return realIp.trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.trim().isEmpty()) ? remoteAddr.trim() : ReportConstants.CREATED_BY_ANONYMOUS;
    }

    private TokenBucket createNewBucket() {
        long refillIntervalMs = ReportConstants.DEFAULT_RATE_LIMIT_REFILL_MINUTES * 60 * 1000L;
        return new TokenBucket(
                ReportConstants.DEFAULT_RATE_LIMIT_CAPACITY,
                ReportConstants.DEFAULT_RATE_LIMIT_REFILL_TOKENS,
                refillIntervalMs
        );
    }

    public static class TokenBucket {
        private final long capacity;
        private final long refillTokens;
        private final long refillIntervalMs;
        private final AtomicLong tokens;
        private final AtomicLong lastRefillTime;

        public TokenBucket(long capacity, long refillTokens, long refillIntervalMs) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillIntervalMs = refillIntervalMs;
            this.tokens = new AtomicLong(capacity);
            this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long last = lastRefillTime.get();
            long elapsed = now - last;
            if (elapsed >= refillIntervalMs) {
                long refillCycles = elapsed / refillIntervalMs;
                long tokensToAdd = refillCycles * refillTokens;
                long currentTokens = tokens.get();
                long newTokens = Math.min(capacity, currentTokens + tokensToAdd);
                tokens.set(newTokens);
                lastRefillTime.set(now);
            }
        }
    }
}
