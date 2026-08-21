package io.chapisoft.report.application.dto;

import io.chapisoft.report.domain.model.DataSourceStatus;
import io.chapisoft.report.domain.model.DatabaseType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataSourceDto {

    private Long id;

    @NotBlank(message = "Mã kết nối (datasourceCode) không được để trống")
    private String datasourceCode;

    private String tenantId;

    @NotBlank(message = "Tên kết nối không được để trống")
    private String name;

    @NotNull(message = "Loại CSDL (dbType) không được để trống")
    private DatabaseType dbType;

    @NotBlank(message = "JDBC URL không được để trống")
    private String jdbcUrl;

    @NotBlank(message = "Username không được để trống")
    private String username;

    private String password;

    private Integer maxPoolSize;
    private Boolean isReadOnly;
    private DataSourceStatus status;
    private Instant createdAt;
}
