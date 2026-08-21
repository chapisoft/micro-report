package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.application.dto.ReportTemplateDto;
import io.chapisoft.report.application.service.ReportTemplateService;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "3. Report Templates", description = "Quản lý mẫu cấu hình báo cáo động theo Tenant")
@RestController
@RequestMapping("/api/v1/reports/templates")
public class ReportTemplateController {

    private final ReportTemplateService templateService;

    public ReportTemplateController(ReportTemplateService templateService) {
        this.templateService = templateService;
    }

    @Operation(summary = "Lấy danh sách mẫu báo cáo theo Tenant")
    @GetMapping
    public ResponseEntity<List<ReportTemplateDto>> listTemplates(@RequestParam(required = false) String status) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        return ResponseEntity.ok(templateService.getTemplatesByTenant(tenantId, status));
    }

    @Operation(summary = "Lấy danh sách mẫu báo cáo đã xuất bản thành Menu riêng")
    @GetMapping("/published")
    public ResponseEntity<List<ReportTemplateDto>> getPublishedTemplates() {
        String tenantId = TenantContext.getTenantIdOrDefault();
        return ResponseEntity.ok(templateService.getPublishedTemplates(tenantId));
    }

    @Operation(summary = "Lấy chi tiết cấu hình 1 mẫu báo cáo")
    @GetMapping("/{templateCode}")
    public ResponseEntity<ReportTemplateDto> getTemplate(@PathVariable String templateCode) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        return ResponseEntity.ok(templateService.getTemplateByCode(tenantId, templateCode));
    }

    @Operation(summary = "Tạo mới mẫu cấu hình báo cáo")
    @PostMapping
    public ResponseEntity<ReportTemplateDto> createTemplate(@Valid @RequestBody ReportTemplateDto dto) {
        TenantContext ctx = TenantContext.get();
        String tenantId = ctx != null && ctx.getTenantId() != null ? ctx.getTenantId() : ReportConstants.DEFAULT_TENANT_ID;
        String createdBy = ctx != null && ctx.getUserId() != null ? ctx.getUserId() : ReportConstants.CREATED_BY_SYSTEM;
        return ResponseEntity.ok(templateService.createTemplate(tenantId, createdBy, dto));
    }

    @Operation(summary = "Cập nhật cấu hình mẫu báo cáo")
    @PutMapping("/{templateCode}")
    public ResponseEntity<ReportTemplateDto> updateTemplate(
            @PathVariable String templateCode,
            @Valid @RequestBody ReportTemplateDto dto) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        return ResponseEntity.ok(templateService.updateTemplate(tenantId, templateCode, dto));
    }

    @Operation(summary = "Xóa mềm mẫu báo cáo")
    @DeleteMapping("/{templateCode}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable String templateCode) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        templateService.deleteTemplate(tenantId, templateCode);
        return ResponseEntity.noContent().build();
    }
}
