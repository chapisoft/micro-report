package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.model.TenantContext;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class RowLevelSecurityTest {

    private final DynamicParameterBinder binder = new DynamicParameterBinder();

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Tự động tiêm các tham số Scope từ TenantContext vào MapSqlParameterSource")
    void testScopeInjection_FromContext() {
        Map<String, Object> scope = new HashMap<>();
        scope.put("branch_id", "CN_HANOI");
        scope.put("province_code", "01");

        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("teller_hn")
                .roles(Set.of("USER"))
                .dataScope(scope)
                .build();
        TenantContext.set(context);

        String sql = "SELECT * FROM INS_DOSSIERS WHERE branch_id = :scope_branch_id AND province_code = :scope_province_code";
        BoundSql boundSql = binder.bind(sql, Collections.emptyMap());

        assertEquals(sql, boundSql.sql());
        assertTrue(boundSql.parameterSource().hasValue("scope_branch_id"));
        assertEquals("CN_HANOI", boundSql.parameterSource().getValue("scope_branch_id"));
        assertTrue(boundSql.parameterSource().hasValue("scope_province_code"));
        assertEquals("01", boundSql.parameterSource().getValue("scope_province_code"));
    }

    @Test
    @DisplayName("Chuyển đổi cú pháp placeholder {{scope.branch_id}} thành :scope_branch_id an toàn")
    void testScopePlaceholder_Binding() {
        Map<String, Object> scope = new HashMap<>();
        scope.put("branch_id", "CN_HCM");

        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("teller_sg")
                .roles(Set.of("USER"))
                .dataScope(scope)
                .build();
        TenantContext.set(context);

        String rawSql = "SELECT * FROM INS_DOSSIERS WHERE branch_id = {{scope.branch_id}} AND status = {{params.status}}";
        Map<String, Object> params = new HashMap<>();
        params.put("status", "SUCCESS");

        BoundSql boundSql = binder.bind(rawSql, params);

        assertEquals("SELECT * FROM INS_DOSSIERS WHERE branch_id = :scope_branch_id AND status = :param_status", boundSql.sql());
        assertEquals("CN_HCM", boundSql.parameterSource().getValue("scope_branch_id"));
        assertEquals("SUCCESS", boundSql.parameterSource().getValue("param_status"));
    }

    @Test
    @DisplayName("Tài khoản cấp Tổng công ty (All Scope) không bị ép scope giả")
    void testScopeAll_HeadquarterUser() {
        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("admin_hq")
                .roles(Set.of("ADMIN"))
                .dataScope(Collections.emptyMap())
                .build();
        TenantContext.set(context);

        String sql = "SELECT * FROM INS_DOSSIERS WHERE status = {{params.status}}";
        Map<String, Object> params = new HashMap<>();
        params.put("status", "COMPLETED");

        BoundSql boundSql = binder.bind(sql, params);

        assertEquals("SELECT * FROM INS_DOSSIERS WHERE status = :param_status", boundSql.sql());
        assertEquals("COMPLETED", boundSql.parameterSource().getValue("param_status"));
    }
}
