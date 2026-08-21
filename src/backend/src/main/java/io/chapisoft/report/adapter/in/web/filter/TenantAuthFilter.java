package io.chapisoft.report.adapter.in.web.filter;

import io.chapisoft.report.adapter.out.persistence.TenantRepository;
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

        // Bỏ qua swagger, actuary, static docs
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/actuator") || path.startsWith("/api/v1/reports/export/download")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String tenantId = null;
            String userId = "SYSTEM";
            String userName = "System User";
            HashSet<String> roles = new HashSet<>();

            String authHeader = request.getHeader("Authorization");
            String headerTenantId = request.getHeader("X-Tenant-Id");
            String apiKey = request.getHeader("X-API-Key");

            // 1. Kiểm tra JWT Token
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                    Claims claims = Jwts.parser()
                            .verifyWith(key)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

                    tenantId = claims.get("tenant_id", String.class);
                    userId = claims.getSubject();
                    userName = claims.get("user_name", String.class);
                    
                    @SuppressWarnings("unchecked")
                    List<String> roleList = claims.get("roles", List.class);
                    if (roleList != null) {
                        roles.addAll(roleList);
                    }
                } catch (Exception e) {
                    log.warn("JWT validation failed: {}", e.getMessage());
                }
            }

            // 2. Fallback sang API-Key / Header X-Tenant-Id
            if (tenantId == null && headerTenantId != null) {
                tenantId = headerTenantId;
                if (apiKey != null) {
                    boolean isValid = tenantRepository.isValidTenantApiKey(headerTenantId, apiKey);
                    if (!isValid) {
                        log.warn("Invalid API Key for Tenant: {}", headerTenantId);
                    }
                }
            }

            // 3. Fallback tenant mặc định nếu cho phép hoặc dùng DEFAULT
            if (tenantId == null) {
                tenantId = allowAnonymous ? "DEFAULT" : "DEFAULT";
            }

            TenantContext context = TenantContext.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .userName(userName)
                    .roles(roles.isEmpty() ? Collections.singleton("USER") : roles)
                    .build();

            TenantContext.set(context);

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }
}
