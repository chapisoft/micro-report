package io.chapisoft.report.adapter.out.persistence;

import io.chapisoft.report.domain.model.ExportTask;
import io.chapisoft.report.domain.model.TaskStatus;

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
public class ExportTaskRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final @NonNull RowMapper<ExportTask> rowMapper = new ExportTaskRowMapper();

    public ExportTaskRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<ExportTask> findByTenantAndTaskCode(String tenantId, String taskCode) {
        String sql = "SELECT * FROM RPT_EXPORT_TASKS WHERE TENANT_ID = :tenantId AND TASK_CODE = :taskCode";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("taskCode", taskCode);
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, params, rowMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<ExportTask> findByTaskCode(String taskCode) {
        String sql = "SELECT * FROM RPT_EXPORT_TASKS WHERE TASK_CODE = :taskCode";
        MapSqlParameterSource params = new MapSqlParameterSource("taskCode", taskCode);
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, params, rowMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<ExportTask> findByTenantId(String tenantId) {
        String sql = "SELECT * FROM RPT_EXPORT_TASKS WHERE TENANT_ID = :tenantId ORDER BY ID DESC LIMIT 50";
        MapSqlParameterSource params = new MapSqlParameterSource("tenantId", tenantId);
        return jdbcTemplate.query(sql, params, rowMapper);
    }

    public void save(ExportTask task) {
        String sql = """
            INSERT INTO RPT_EXPORT_TASKS (
                TASK_CODE, TENANT_ID, TEMPLATE_ID, FILE_NAME, FILE_PATH, 
                FILE_SIZE_BYTES, ROW_COUNT, STATUS, CREATED_AT, EXPIRES_AT, CREATED_BY
            ) VALUES (
                :taskCode, :tenantId, :templateId, :fileName, :filePath, 
                :fileSizeBytes, :rowCount, :status, :createdAt, :expiresAt, :createdBy
            )
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("taskCode", task.getTaskCode())
                .addValue("tenantId", task.getTenantId())
                .addValue("templateId", task.getTemplateId())
                .addValue("fileName", task.getFileName())
                .addValue("filePath", task.getFilePath())
                .addValue("fileSizeBytes", task.getFileSizeBytes())
                .addValue("rowCount", task.getRowCount())
                .addValue("status", task.getStatus().name())
                .addValue("createdAt", Timestamp.from(task.getCreatedAt() != null ? task.getCreatedAt() : Instant.now()))
                .addValue("expiresAt", Timestamp.from(task.getExpiresAt()))
                .addValue("createdBy", task.getCreatedBy());

        jdbcTemplate.update(sql, params);
    }

    public void updateStatus(String taskCode, TaskStatus status, Long fileSizeBytes, Integer rowCount) {
        String sql = """
            UPDATE RPT_EXPORT_TASKS SET 
                STATUS = :status,
                FILE_SIZE_BYTES = :fileSizeBytes,
                ROW_COUNT = :rowCount
            WHERE TASK_CODE = :taskCode
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("status", status.name())
                .addValue("fileSizeBytes", fileSizeBytes)
                .addValue("rowCount", rowCount)
                .addValue("taskCode", taskCode);
        jdbcTemplate.update(sql, params);
    }

    public List<ExportTask> findExpiredTasks(Instant now) {
        String sql = "SELECT * FROM RPT_EXPORT_TASKS WHERE EXPIRES_AT < :now AND STATUS <> 'EXPIRED'";
        MapSqlParameterSource params = new MapSqlParameterSource("now", Timestamp.from(now));
        return jdbcTemplate.query(sql, params, rowMapper);
    }

    public void markAsExpired(Long id) {
        String sql = "UPDATE RPT_EXPORT_TASKS SET STATUS = 'EXPIRED' WHERE ID = :id";
        MapSqlParameterSource params = new MapSqlParameterSource("id", id);
        jdbcTemplate.update(sql, params);
    }

    private static class ExportTaskRowMapper implements RowMapper<ExportTask> {
        @Override
        public ExportTask mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
            Timestamp createdTs = rs.getTimestamp("CREATED_AT");
            Timestamp expiresTs = rs.getTimestamp("EXPIRES_AT");

            return ExportTask.builder()
                    .id(rs.getLong("ID"))
                    .taskCode(rs.getString("TASK_CODE"))
                    .tenantId(rs.getString("TENANT_ID"))
                    .templateId(rs.getObject("TEMPLATE_ID") != null ? rs.getLong("TEMPLATE_ID") : null)
                    .fileName(rs.getString("FILE_NAME"))
                    .filePath(rs.getString("FILE_PATH"))
                    .fileSizeBytes(rs.getObject("FILE_SIZE_BYTES") != null ? rs.getLong("FILE_SIZE_BYTES") : null)
                    .rowCount(rs.getObject("ROW_COUNT") != null ? rs.getInt("ROW_COUNT") : null)
                    .status(TaskStatus.valueOf(rs.getString("STATUS")))
                    .createdAt(createdTs != null ? createdTs.toInstant() : null)
                    .expiresAt(expiresTs != null ? expiresTs.toInstant() : null)
                    .createdBy(rs.getString("CREATED_BY"))
                    .build();
        }
    }
}
