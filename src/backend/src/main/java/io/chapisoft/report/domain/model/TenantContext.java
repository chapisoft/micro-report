package io.chapisoft.report.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContext {

    private static final ThreadLocal<TenantContext> CURRENT_TENANT = new ThreadLocal<>();

    private String tenantId;
    private String userId;
    private String userName;
    private Set<String> roles;
    private Map<String, Object> dataScope;
    private Set<String> allowedDataSources;

    public static TenantContext get() {
        return CURRENT_TENANT.get();
    }

    public static void set(TenantContext context) {
        CURRENT_TENANT.set(context);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }

    public static String getTenantIdOrDefault() {
        TenantContext ctx = CURRENT_TENANT.get();
        return ctx != null && ctx.getTenantId() != null ? ctx.getTenantId() : ReportConstants.DEFAULT_TENANT_ID;
    }

    public boolean isAdmin() {
        if (roles == null || roles.isEmpty()) {
            return false;
        }
        return roles.stream().anyMatch(r -> 
            ReportConstants.ROLE_ADMIN.equalsIgnoreCase(r)
            || ReportConstants.ROLE_SUPER_ADMIN.equalsIgnoreCase(r)
            || ReportConstants.ROLE_DATA_MANAGER.equalsIgnoreCase(r)
            || "ROLE_ADMIN".equalsIgnoreCase(r)
            || "ROLE_SUPER_ADMIN".equalsIgnoreCase(r)
        );
    }

    public Map<String, Object> getDataScope() {
        return dataScope != null ? dataScope : Collections.emptyMap();
    }

    public Set<String> getAllowedDataSources() {
        return allowedDataSources != null ? allowedDataSources : Collections.emptySet();
    }
}
