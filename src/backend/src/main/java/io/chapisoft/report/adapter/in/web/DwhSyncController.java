package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.application.dto.DwhSyncRequest;
import io.chapisoft.report.domain.model.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@Tag(name = "6. DWH Synchronization", description = "Đồng bộ và quản trị dữ liệu kho DWH/OLAP")
@RestController
@RequestMapping("/api/v1/reports/dwh")
public class DwhSyncController {

    @Operation(summary = "Kích hoạt đồng bộ bù thủ công theo khoảng ngày")
    @PostMapping("/sync/manual")
    public ResponseEntity<Map<String, Object>> manualSync(@Valid @RequestBody DwhSyncRequest request) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        log.info("Nhận yêu cầu đồng bộ thủ công cho Tenant [{}], Table [{}], Khoảng ngày: {} -> {}",
                tenantId, request.getTableName(), request.getFromDate(), request.getToDate());

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã kích hoạt đồng bộ bù cho bảng: " + request.getTableName(),
                "tenantId", tenantId,
                "datasourceCode", request.getDatasourceCode()
        ));
    }
}
