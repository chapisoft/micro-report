package io.chapisoft.report.adapter.out.persistence;

import io.chapisoft.report.domain.model.TenantStatus;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class TenantRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public TenantRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isValidTenantApiKey(String tenantId, String apiKey) {
        String sql = "SELECT COUNT(1) FROM RPT_TENANTS WHERE TENANT_ID = :tenantId AND STATUS = :activeStatus";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("activeStatus", TenantStatus.ACTIVE.name());
        Integer count = jdbcTemplate.queryForObject(sql, params, Integer.class);
        return count != null && count > 0;
    }

    public Optional<String> getTenantStatus(String tenantId) {
        String sql = "SELECT STATUS FROM RPT_TENANTS WHERE TENANT_ID = :tenantId";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId);
        try {
            String status = jdbcTemplate.queryForObject(sql, params, String.class);
            return Optional.ofNullable(status);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
