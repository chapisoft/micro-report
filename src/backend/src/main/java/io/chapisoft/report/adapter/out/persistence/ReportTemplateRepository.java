package io.chapisoft.report.adapter.out.persistence;

import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.ReportTemplate;
import io.chapisoft.report.domain.model.TemplateStatus;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class ReportTemplateRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final @NonNull RowMapper<ReportTemplate> rowMapper = new ReportTemplateRowMapper();

    public ReportTemplateRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ReportTemplate> findByTenantId(String tenantId, String status) {
        String sql = """
            SELECT * FROM RPT_TEMPLATES 
            WHERE TENANT_ID = :tenantId 
              AND DELETED_AT IS NULL
              AND (:status IS NULL OR STATUS = :status)
            ORDER BY ID DESC
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("status", status);
        return jdbcTemplate.query(sql, params, rowMapper);
    }

    public Optional<ReportTemplate> findByTenantAndCode(String tenantId, String templateCode) {
        String sql = """
            SELECT * FROM RPT_TEMPLATES 
            WHERE TENANT_ID = :tenantId 
              AND TEMPLATE_CODE = :templateCode 
              AND DELETED_AT IS NULL
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("templateCode", templateCode);
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, params, rowMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<ReportTemplate> findByIdAndTenant(Long id, String tenantId) {
        String sql = """
            SELECT * FROM RPT_TEMPLATES 
            WHERE ID = :id 
              AND TENANT_ID = :tenantId 
              AND DELETED_AT IS NULL
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId);
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, params, rowMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void save(ReportTemplate template) {
        String sql = """
            INSERT INTO RPT_TEMPLATES (
                TEMPLATE_CODE, TENANT_ID, DATASOURCE_CODE, TEMPLATE_NAME, MODE, STATUS, 
                IS_PUBLIC, IS_SYSTEM, CONFIG_JSON, TRANSFORM_JS, ACCESS_COUNT, CREATED_AT, CREATED_BY
            ) VALUES (
                :templateCode, :tenantId, :datasourceCode, :templateName, :mode, :status, 
                :isPublic, :isSystem, :configJson, :transformJs, :accessCount, :createdAt, :createdBy
            )
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("templateCode", template.getTemplateCode())
                .addValue("tenantId", template.getTenantId())
                .addValue("datasourceCode", template.getDatasourceCode())
                .addValue("templateName", template.getTemplateName())
                .addValue("mode", template.getMode().name())
                .addValue("status", template.getStatus() != null ? template.getStatus().name() : TemplateStatus.ACTIVE.name())
                .addValue("isPublic", template.getIsPublic() != null ? template.getIsPublic() : false)
                .addValue("isSystem", template.getIsSystem() != null ? template.getIsSystem() : false)
                .addValue("configJson", template.getConfigJson())
                .addValue("transformJs", template.getTransformJs())
                .addValue("accessCount", template.getAccessCount() != null ? template.getAccessCount() : 0)
                .addValue("createdAt", Timestamp.from(template.getCreatedAt() != null ? template.getCreatedAt() : Instant.now()))
                .addValue("createdBy", template.getCreatedBy());

        jdbcTemplate.update(sql, params);
    }

    public void update(ReportTemplate template) {
        String sql = """
            UPDATE RPT_TEMPLATES SET 
                TEMPLATE_NAME = :templateName,
                DATASOURCE_CODE = :datasourceCode,
                MODE = :mode,
                STATUS = :status,
                CONFIG_JSON = :configJson,
                TRANSFORM_JS = :transformJs,
                UPDATED_AT = :updatedAt
            WHERE TENANT_ID = :tenantId AND TEMPLATE_CODE = :templateCode AND DELETED_AT IS NULL
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("templateName", template.getTemplateName())
                .addValue("datasourceCode", template.getDatasourceCode())
                .addValue("mode", template.getMode().name())
                .addValue("status", template.getStatus() != null ? template.getStatus().name() : TemplateStatus.ACTIVE.name())
                .addValue("configJson", template.getConfigJson())
                .addValue("transformJs", template.getTransformJs())
                .addValue("updatedAt", Timestamp.from(Instant.now()))
                .addValue("tenantId", template.getTenantId())
                .addValue("templateCode", template.getTemplateCode());

        jdbcTemplate.update(sql, params);
    }

    public void incrementAccessCount(String tenantId, String templateCode) {
        String sql = """
            UPDATE RPT_TEMPLATES SET 
                ACCESS_COUNT = ACCESS_COUNT + 1,
                LAST_ACCESSED_AT = :now
            WHERE TENANT_ID = :tenantId AND TEMPLATE_CODE = :templateCode
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("now", Timestamp.from(Instant.now()))
                .addValue("tenantId", tenantId)
                .addValue("templateCode", templateCode);
        jdbcTemplate.update(sql, params);
    }

    public void softDelete(String tenantId, String templateCode) {
        String sql = """
            UPDATE RPT_TEMPLATES SET 
                DELETED_AT = :deletedAt
            WHERE TENANT_ID = :tenantId AND TEMPLATE_CODE = :templateCode
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("deletedAt", Timestamp.from(Instant.now()))
                .addValue("tenantId", tenantId)
                .addValue("templateCode", templateCode);
        jdbcTemplate.update(sql, params);
    }

    public int freezeInactiveTemplates(Instant beforeDate) {
        String sql = """
            UPDATE RPT_TEMPLATES SET 
                STATUS = :archivedStatus,
                UPDATED_AT = :now
            WHERE STATUS = :activeStatus
              AND (
                    (LAST_ACCESSED_AT IS NOT NULL AND LAST_ACCESSED_AT < :beforeDate)
                    OR (LAST_ACCESSED_AT IS NULL AND CREATED_AT < :beforeDate)
                  )
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("archivedStatus", TemplateStatus.ARCHIVED.name())
                .addValue("activeStatus", TemplateStatus.ACTIVE.name())
                .addValue("now", Timestamp.from(Instant.now()))
                .addValue("beforeDate", Timestamp.from(beforeDate));
        return jdbcTemplate.update(sql, params);
    }

    private static class ReportTemplateRowMapper implements RowMapper<ReportTemplate> {
        @Override
        public ReportTemplate mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
            Timestamp lastAccessedTs = rs.getTimestamp("LAST_ACCESSED_AT");
            Timestamp createdTs = rs.getTimestamp("CREATED_AT");
            Timestamp updatedTs = rs.getTimestamp("UPDATED_AT");
            Timestamp deletedTs = rs.getTimestamp("DELETED_AT");

            return ReportTemplate.builder()
                    .id(rs.getLong("ID"))
                    .templateCode(rs.getString("TEMPLATE_CODE"))
                    .tenantId(rs.getString("TENANT_ID"))
                    .datasourceCode(rs.getString("DATASOURCE_CODE"))
                    .templateName(rs.getString("TEMPLATE_NAME"))
                    .mode(QueryMode.valueOf(rs.getString("MODE")))
                    .status(TemplateStatus.valueOf(rs.getString("STATUS")))
                    .isPublic(rs.getBoolean("IS_PUBLIC"))
                    .isSystem(rs.getBoolean("IS_SYSTEM"))
                    .configJson(rs.getString("CONFIG_JSON"))
                    .transformJs(rs.getString("TRANSFORM_JS"))
                    .accessCount(rs.getInt("ACCESS_COUNT"))
                    .lastAccessedAt(lastAccessedTs != null ? lastAccessedTs.toInstant() : null)
                    .createdAt(createdTs != null ? createdTs.toInstant() : null)
                    .updatedAt(updatedTs != null ? updatedTs.toInstant() : null)
                    .createdBy(rs.getString("CREATED_BY"))
                    .deletedAt(deletedTs != null ? deletedTs.toInstant() : null)
                    .build();
        }
    }
}
