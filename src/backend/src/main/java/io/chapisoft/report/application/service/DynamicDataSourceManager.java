package io.chapisoft.report.application.service;

import io.chapisoft.report.adapter.out.persistence.DataSourceRepository;
import io.chapisoft.report.domain.exception.ResourceNotFoundException;
import io.chapisoft.report.domain.model.DataSourceConfig;
import io.chapisoft.report.domain.model.DatabaseType;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.security.AesEncryptionService;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class DynamicDataSourceManager {

    private final DataSourceRepository dataSourceRepository;
    private final AesEncryptionService aesEncryptionService;
    private final Map<String, HikariDataSource> connectionPools = new ConcurrentHashMap<>();

    public DynamicDataSourceManager(DataSourceRepository dataSourceRepository,
            AesEncryptionService aesEncryptionService) {
        this.dataSourceRepository = dataSourceRepository;
        this.aesEncryptionService = aesEncryptionService;
    }

    public DataSource getDataSource(String tenantId, String datasourceCode) {
        String cacheKey = buildCacheKey(tenantId, datasourceCode);
        return connectionPools.computeIfAbsent(cacheKey, key -> createHikariDataSource(tenantId, datasourceCode));
    }

    public NamedParameterJdbcTemplate getJdbcTemplate(String tenantId, String datasourceCode) {
        NamedParameterJdbcTemplate namedJdbcTemplate = new NamedParameterJdbcTemplate(Objects.requireNonNull(getDataSource(tenantId, datasourceCode)));
        namedJdbcTemplate.getJdbcTemplate().setQueryTimeout(ReportConstants.DEFAULT_STATEMENT_TIMEOUT_SECONDS);
        return namedJdbcTemplate;
    }

    public DatabaseType getDatabaseType(String tenantId, String datasourceCode) {
        return dataSourceRepository.findByTenantAndCode(tenantId, datasourceCode)
                .map(DataSourceConfig::getDbType)
                .orElse(null);
    }

    private HikariDataSource createHikariDataSource(String tenantId, String datasourceCode) {
        DataSourceConfig config = dataSourceRepository.findByTenantAndCode(tenantId, datasourceCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy kết nối CSDL với mã: " + datasourceCode + " cho tenant: " + tenantId));

        log.info("Khởi tạo HikariPool cho Tenant [{}], DataSource [{}]", tenantId, datasourceCode);

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setPoolName("Hikari-" + tenantId + "-" + datasourceCode);
        hikariConfig.setDriverClassName(config.getDbType().getDriverClassName());
        hikariConfig.setJdbcUrl(config.getJdbcUrl());
        hikariConfig.setUsername(config.getUsername());
        hikariConfig.setPassword(aesEncryptionService.decrypt(config.getPasswordEncrypted()));
        hikariConfig.setMaximumPoolSize(config.getMaxPoolSize() != null ? config.getMaxPoolSize()
                : ReportConstants.DEFAULT_HIKARI_MAX_POOL_SIZE_FALLBACK);
        hikariConfig.setMinimumIdle(ReportConstants.DEFAULT_HIKARI_MIN_IDLE);
        hikariConfig.setConnectionTimeout(ReportConstants.DEFAULT_HIKARI_CONNECTION_TIMEOUT_MS);
        hikariConfig.setValidationTimeout(ReportConstants.DEFAULT_HIKARI_VALIDATION_TIMEOUT_MS);
        hikariConfig.setConnectionTestQuery(config.getDbType().getValidationQuery());
        hikariConfig.setReadOnly(config.getIsReadOnly() != null ? config.getIsReadOnly() : true);
        hikariConfig.setAutoCommit(true);

        return new HikariDataSource(hikariConfig);
    }

    public void evictDataSource(String tenantId, String datasourceCode) {
        String cacheKey = buildCacheKey(tenantId, datasourceCode);
        HikariDataSource ds = connectionPools.remove(cacheKey);
        if (ds != null && !ds.isClosed()) {
            ds.close();
            log.info("Đã đóng kết nối HikariPool cho Tenant [{}], DataSource [{}]", tenantId, datasourceCode);
        }
    }

    @PreDestroy
    public void closeAllPools() {
        connectionPools.forEach((key, pool) -> {
            if (pool != null && !pool.isClosed()) {
                pool.close();
            }
        });
        connectionPools.clear();
    }

    private String buildCacheKey(String tenantId, String datasourceCode) {
        return tenantId + "::" + datasourceCode;
    }
}
