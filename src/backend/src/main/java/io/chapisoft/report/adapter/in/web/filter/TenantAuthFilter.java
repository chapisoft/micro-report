package io.chapisoft.report.adapter.in.web.filter;

import io.chapisoft.report.adapter.out.persistence.TenantRepository;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

@Slf4j
@Component
public class TenantAuthFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;
    private final String jwtSecret;
    private final boolean allowAnonymous;

    public TenantAuthFilter(
            TenantRepository tenantRepository,
            @Value("${report.security.jwt-secret:MASCOM_DYNAMIC_REPORT_SUPER_SECRET_JWT_SIGNING_KEY_2026_VERY_SECURE}") String jwtSecret,
            @Value("${report.security.allow-anonymous:false}") boolean allowAnonymous) {
        this.tenantRepository = tenantRepository;
        this.jwtSecret = jwtSecret;
        this.allowAnonymous = allowAnonymous;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Bỏ qua swagger, actuator, static docs, download
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/actuator") || path.startsWith("/api/v1/reports/export/download")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String tenantId = null;
            String userId = ReportConstants.CREATED_BY_SYSTEM;
            String userName = ReportConstants.DEFAULT_SYSTEM_USER_NAME;
            HashSet<String> roles = new HashSet<>();

            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            String headerTenantId = request.getHeader(ReportConstants.HEADER_TENANT_ID);
            String apiKey = request.getHeader(ReportConstants.HEADER_API_KEY);

            String queryTenantId = request.getParameter("tenant");
            if (queryTenantId == null) {
                queryTenantId = request.getParameter("tenantId");
            }
            if (queryTenantId == null) {
                queryTenantId = request.getParameter(ReportConstants.HEADER_TENANT_ID);
            }

            String queryApiKey = request.getParameter("apiKey");
            if (queryApiKey == null) {
                queryApiKey = request.getParameter("key");
            }

            String queryToken = request.getParameter("token");
            if (queryToken == null) {
                queryToken = request.getParameter("authToken");
            }

            // 1. Kiểm tra JWT Token (từ Header Authorization hoặc Query Parameter token)
            String rawToken = null;
            if (authHeader != null && authHeader.startsWith(ReportConstants.BEARER_PREFIX)) {
                rawToken = authHeader.substring(ReportConstants.BEARER_PREFIX.length());
            } else if (queryToken != null && !queryToken.trim().isEmpty()) {
                rawToken = queryToken.trim();
            }

            if (rawToken != null) {
                try {
                    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                    Claims claims = Jwts.parser()
                            .verifyWith(key)
                            .build()
                            .parseSignedClaims(rawToken)
                            .getPayload();

                    tenantId = claims.get(ReportConstants.CLAIM_TENANT_ID, String.class);
                    userId = claims.getSubject();
                    userName = claims.get(ReportConstants.CLAIM_USER_NAME, String.class);
                    
                    @SuppressWarnings("unchecked")
                    List<String> roleList = claims.get(ReportConstants.CLAIM_ROLES, List.class);
                    if (roleList != null) {
                        roles.addAll(roleList);
                    }
                } catch (Exception e) {
                    log.warn("JWT validation failed: {}", e.getMessage());
                }
            }

            // 2. Fallback sang API-Key / Header X-Tenant-Id hoặc Query Parameter tenant
            if (tenantId == null) {
                String effectiveTenant = (headerTenantId != null && !headerTenantId.trim().isEmpty()) 
                        ? headerTenantId.trim() 
                        : (queryTenantId != null && !queryTenantId.trim().isEmpty() ? queryTenantId.trim() : null);
                String effectiveApiKey = (apiKey != null && !apiKey.trim().isEmpty()) 
                        ? apiKey.trim() 
                        : (queryApiKey != null && !queryApiKey.trim().isEmpty() ? queryApiKey.trim() : null);

                if (effectiveTenant != null) {
                    tenantId = effectiveTenant;
                    if (effectiveApiKey != null) {
                        boolean isValid = tenantRepository.isValidTenantApiKey(effectiveTenant, effectiveApiKey);
                        if (!isValid) {
                            log.warn("Invalid API Key for Tenant: {}", effectiveTenant);
                        }
                    }
                }
            }

            // 3. Kiểm tra bắt buộc thông tin đối tác (Chặn 401 nếu không có thông tin xác thực)
            if (tenantId == null) {
                if (allowAnonymous) {
                    tenantId = ReportConstants.DEFAULT_TENANT_ID;
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"status\":401,\"error\":\"UNAUTHORIZED\",\"message\":\"Yêu cầu xác thực đối tác: Vui lòng cung cấp mã đối tác (Header X-Tenant-Id hoặc tham số tenant) kèm khóa xác thực.\"}");
                    return;
                }
            }

            TenantContext context = TenantContext.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userName(userName)
                    .roles(roles.isEmpty() ? Collections.singleton(ReportConstants.DEFAULT_ROLE_USER) : roles)
                    .build();

            TenantContext.set(context);

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }
}
