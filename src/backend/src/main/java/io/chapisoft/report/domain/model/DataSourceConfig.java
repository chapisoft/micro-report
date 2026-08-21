package io.chapisoft.report.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataSourceConfig {

    private Long id;
    private String datasourceCode;
    private String tenantId;
    private String name;
    private DatabaseType dbType;
    private String jdbcUrl;
    private String username;
    private String passwordEncrypted;
    private Integer maxPoolSize;
    private Boolean isReadOnly;
    private DataSourceStatus status;
    private Instant createdAt;
}
