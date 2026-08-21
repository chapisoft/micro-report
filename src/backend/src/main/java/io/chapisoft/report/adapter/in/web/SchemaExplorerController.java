package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.application.dto.SchemaInfoDto;
import io.chapisoft.report.application.service.SchemaExplorerService;
import io.chapisoft.report.domain.model.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "2. Schema Explorer", description = "Quét và khám phá cấu trúc Bảng/Cột CSDL động")
@RestController
@RequestMapping("/api/v1/reports/schema")
public class SchemaExplorerController {

    private final SchemaExplorerService schemaExplorerService;

    public SchemaExplorerController(SchemaExplorerService schemaExplorerService) {
        this.schemaExplorerService = schemaExplorerService;
    }

    @Operation(summary = "Lấy danh mục Bảng và Cột theo DataSource")
    @GetMapping("/{datasourceCode}")
    public ResponseEntity<SchemaInfoDto> exploreSchema(@PathVariable String datasourceCode) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        SchemaInfoDto schemaInfo = schemaExplorerService.exploreSchema(tenantId, datasourceCode);
        return ResponseEntity.ok(schemaInfo);
    }
}
