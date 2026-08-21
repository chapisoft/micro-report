package io.chapisoft.report.adapter.out.persistence;

import io.chapisoft.report.domain.model.DataSourceConfig;
import io.chapisoft.report.domain.model.DataSourceStatus;
import io.chapisoft.report.domain.model.DatabaseType;

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
public class DataSourceRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final @NonNull RowMapper<DataSourceConfig> rowMapper = new DataSourceRowMapper();

    public DataSourceRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DataSourceConfig> findByTenantId(String tenantId) {
        String sql = "SELECT * FROM RPT_DATASOURCES WHERE TENANT_ID = :tenantId AND STATUS = :activeStatus ORDER BY ID DESC";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("activeStatus", DataSourceStatus.ACTIVE.name());
        return jdbcTemplate.query(sql, params, rowMapper);
    }

    public Optional<DataSourceConfig> findByTenantAndCode(String tenantId, String datasourceCode) {
        String sql = "SELECT * FROM RPT_DATASOURCES WHERE TENANT_ID = :tenantId AND DATASOURCE_CODE = :datasourceCode AND STATUS = :activeStatus";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("datasourceCode", datasourceCode)
                .addValue("activeStatus", DataSourceStatus.ACTIVE.name());
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, params, rowMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void save(DataSourceConfig config) {
        String sql = """
            INSERT INTO RPT_DATASOURCES (
                DATASOURCE_CODE, TENANT_ID, NAME, DB_TYPE, JDBC_URL, 
                USERNAME, PASSWORD_ENCRYPTED, MAX_POOL_SIZE, IS_READ_ONLY, STATUS, CREATED_AT
            ) VALUES (
                :datasourceCode, :tenantId, :name, :dbType, :jdbcUrl, 
                :username, :passwordEncrypted, :maxPoolSize, :isReadOnly, :status, :createdAt
            )
            """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("datasourceCode", config.getDatasourceCode())
                .addValue("tenantId", config.getTenantId())
                .addValue("name", config.getName())
                .addValue("dbType", config.getDbType().name())
                .addValue("jdbcUrl", config.getJdbcUrl())
                .addValue("username", config.getUsername())
                .addValue("passwordEncrypted", config.getPasswordEncrypted())
                .addValue("maxPoolSize", config.getMaxPoolSize() != null ? config.getMaxPoolSize() : 10)
                .addValue("isReadOnly", config.getIsReadOnly() != null ? config.getIsReadOnly() : true)
                .addValue("status", config.getStatus() != null ? config.getStatus().name() : DataSourceStatus.ACTIVE.name())
                .addValue("createdAt", Timestamp.from(config.getCreatedAt() != null ? config.getCreatedAt() : Instant.now()));

        jdbcTemplate.update(sql, params);
    }

    public void deleteByTenantAndCode(String tenantId, String datasourceCode) {
        String sql = "UPDATE RPT_DATASOURCES SET STATUS = :inactiveStatus WHERE TENANT_ID = :tenantId AND DATASOURCE_CODE = :datasourceCode";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("datasourceCode", datasourceCode)
                .addValue("inactiveStatus", DataSourceStatus.INACTIVE.name());
        jdbcTemplate.update(sql, params);
    }

    private static class DataSourceRowMapper implements RowMapper<DataSourceConfig> {
        @Override
        public DataSourceConfig mapRow(@NonNull ResultSet rs, int rowNum) throws SQLException {
            Timestamp createdTs = rs.getTimestamp("CREATED_AT");
            return DataSourceConfig.builder()
                    .id(rs.getLong("ID"))
                    .datasourceCode(rs.getString("DATASOURCE_CODE"))
                    .tenantId(rs.getString("TENANT_ID"))
                    .name(rs.getString("NAME"))
                    .dbType(DatabaseType.valueOf(rs.getString("DB_TYPE")))
                    .jdbcUrl(rs.getString("JDBC_URL"))
                    .username(rs.getString("USERNAME"))
                    .passwordEncrypted(rs.getString("PASSWORD_ENCRYPTED"))
                    .maxPoolSize(rs.getInt("MAX_POOL_SIZE"))
                    .isReadOnly(rs.getBoolean("IS_READ_ONLY"))
                    .status(DataSourceStatus.valueOf(rs.getString("STATUS")))
                    .createdAt(createdTs != null ? createdTs.toInstant() : null)
                    .build();
        }
    }
}
