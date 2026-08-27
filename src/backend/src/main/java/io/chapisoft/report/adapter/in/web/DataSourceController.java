package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.adapter.out.persistence.DataSourceRepository;
import io.chapisoft.report.application.dto.DataSourceDto;
import io.chapisoft.report.domain.model.DataSourceConfig;
import io.chapisoft.report.domain.model.DataSourceStatus;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;
import io.chapisoft.report.domain.security.AesEncryptionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Tag(name = "1. DataSources", description = "Quản lý kết nối CSDL động theo Tenant")
@RestController
@RequestMapping("/api/v1/reports/datasources")
public class DataSourceController {

    private final DataSourceRepository dataSourceRepository;
    private final AesEncryptionService aesEncryptionService;

    public DataSourceController(DataSourceRepository dataSourceRepository,
                                AesEncryptionService aesEncryptionService) {
        this.dataSourceRepository = dataSourceRepository;
        this.aesEncryptionService = aesEncryptionService;
    }

    @Operation(summary = "Lấy danh sách kết nối CSDL theo Tenant và bộ lọc listDatasource")
    @GetMapping
    public ResponseEntity<List<DataSourceDto>> listDataSources(
            @RequestParam(name = "listDatasource", required = false) String listDatasource,
            @RequestParam(name = "allowedCodes", required = false) String allowedCodes) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        TenantContext ctx = TenantContext.get();
        Set<String> sessionAllowed = ctx != null ? ctx.getAllowedDataSources() : Collections.emptySet();

        String filterParam = (listDatasource != null && !listDatasource.trim().isEmpty()) ? listDatasource : allowedCodes;

        Set<String> allowedSet = new HashSet<>();
        if (filterParam != null && !filterParam.trim().isEmpty() && !ReportConstants.FILTER_ALL.equalsIgnoreCase(filterParam.trim())) {
            for (String raw : filterParam.split(",")) {
                if (raw != null && !raw.trim().isEmpty()) {
                    allowedSet.add(raw.trim());
                }
            }
        }

        // Nếu phiên làm việc có giới hạn DataSource ủy quyền, lấy giao tập hợp
        if (!sessionAllowed.isEmpty()) {
            if (allowedSet.isEmpty()) {
                allowedSet.addAll(sessionAllowed);
            } else {
                allowedSet.retainAll(sessionAllowed);
            }
        }

        List<DataSourceConfig> allForTenant = dataSourceRepository.findByTenantId(tenantId);

        if (allowedSet.isEmpty() && sessionAllowed.isEmpty() && (filterParam == null || filterParam.trim().isEmpty() || ReportConstants.FILTER_ALL.equalsIgnoreCase(filterParam.trim()))) {
            List<DataSourceDto> list = allForTenant.stream()
                    .map(this::mapToDto)
                    .toList();
            return ResponseEntity.ok(list);
        }

        List<DataSourceDto> filteredList = allForTenant.stream()
                .filter(ds -> allowedSet.contains(ds.getDatasourceCode()))
                .map(this::mapToDto)
                .toList();

        return ResponseEntity.ok(filteredList);
    }

    @Operation(summary = "Thêm mới kết nối CSDL cho Tenant")
    @PostMapping
    public ResponseEntity<DataSourceDto> createDataSource(@Valid @RequestBody DataSourceDto dto) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        String encryptedPassword = aesEncryptionService.encrypt(dto.getPassword());

        DataSourceConfig config = DataSourceConfig.builder()
                .datasourceCode(dto.getDatasourceCode())
                .tenantId(tenantId)
                .name(dto.getName())
                .dbType(dto.getDbType())
                .jdbcUrl(dto.getJdbcUrl())
                .username(dto.getUsername())
                .passwordEncrypted(encryptedPassword)
                .maxPoolSize(dto.getMaxPoolSize() != null ? dto.getMaxPoolSize() : ReportConstants.DEFAULT_MAX_POOL_SIZE)
                .isReadOnly(dto.getIsReadOnly() != null ? dto.getIsReadOnly() : true)
                .status(DataSourceStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        dataSourceRepository.save(config);
        return ResponseEntity.ok(mapToDto(config));
    }

    @Operation(summary = "Xóa mềm kết nối CSDL")
    @DeleteMapping("/{datasourceCode}")
    public ResponseEntity<Void> deleteDataSource(@PathVariable String datasourceCode) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        dataSourceRepository.deleteByTenantAndCode(tenantId, datasourceCode);
        return ResponseEntity.noContent().build();
    }

    private DataSourceDto mapToDto(DataSourceConfig entity) {
        return DataSourceDto.builder()
                .id(entity.getId())
                .datasourceCode(entity.getDatasourceCode())
                .tenantId(entity.getTenantId())
                .name(entity.getName())
                .dbType(entity.getDbType())
                .jdbcUrl(entity.getJdbcUrl())
                .username(entity.getUsername())
                .maxPoolSize(entity.getMaxPoolSize())
                .isReadOnly(entity.getIsReadOnly())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
