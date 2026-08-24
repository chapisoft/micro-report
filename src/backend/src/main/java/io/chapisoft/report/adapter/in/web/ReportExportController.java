package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.adapter.out.persistence.ExportTaskRepository;
import io.chapisoft.report.application.dto.ExportRequest;
import io.chapisoft.report.application.dto.ExportTaskDto;
import io.chapisoft.report.application.service.SxssfStreamingExportService;
import io.chapisoft.report.domain.exception.ResourceNotFoundException;
import io.chapisoft.report.domain.model.ExportTask;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.List;

@Tag(name = "5. Export Engine", description = "Xuất dữ liệu lớn Excel/CSV bằng SXSSF Streaming")
@RestController
@RequestMapping("/api/v1/reports/export")
public class ReportExportController {

    private final SxssfStreamingExportService exportService;
    private final ExportTaskRepository exportTaskRepository;

    public ReportExportController(SxssfStreamingExportService exportService,
                                  ExportTaskRepository exportTaskRepository) {
        this.exportService = exportService;
        this.exportTaskRepository = exportTaskRepository;
    }

    @Operation(summary = "Xuất file Excel (.xlsx) với SXSSF Streaming (tới 100.000 dòng)")
    @PostMapping("/excel")
    public ResponseEntity<ExportTaskDto> exportExcel(@Valid @RequestBody ExportRequest request) {
        TenantContext ctx = TenantContext.get();
        String tenantId = ctx != null && ctx.getTenantId() != null ? ctx.getTenantId() : ReportConstants.DEFAULT_TENANT_ID;
        String createdBy = ctx != null && ctx.getUserId() != null ? ctx.getUserId() : ReportConstants.CREATED_BY_SYSTEM;
        return ResponseEntity.ok(exportService.exportToExcel(tenantId, createdBy, request));
    }

    @Operation(summary = "Xuất file CSV với SXSSF Streaming")
    @PostMapping("/csv")
    public ResponseEntity<ExportTaskDto> exportCsv(@Valid @RequestBody ExportRequest request) {
        TenantContext ctx = TenantContext.get();
        String tenantId = ctx != null && ctx.getTenantId() != null ? ctx.getTenantId() : ReportConstants.DEFAULT_TENANT_ID;
        String createdBy = ctx != null && ctx.getUserId() != null ? ctx.getUserId() : ReportConstants.CREATED_BY_SYSTEM;
        return ResponseEntity.ok(exportService.exportToCsv(tenantId, createdBy, request));
    }

    @Operation(summary = "Tải file báo cáo theo Task Code")
    @GetMapping("/download/{taskCode}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String taskCode) {
        ExportTask task = exportTaskRepository.findByTaskCode(taskCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tiến trình xuất file: " + taskCode));

        File file = new File(task.getFilePath());
        if (!file.exists()) {
            throw new ResourceNotFoundException("File báo cáo đã hết hạn hoặc bị xóa trên hệ thống.");
        }

        Resource resource = new FileSystemResource(file);
        MediaType mediaType = task.getFileName().endsWith(".csv")
                ? MediaType.parseMediaType("text/csv; charset=UTF-8")
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + task.getFileName() + "\"")
                .contentType(mediaType)
                .contentLength(file.length())
                .body(resource);
    }

    @Operation(summary = "Danh sách các tác vụ xuất file theo Tenant")
    @GetMapping("/tasks")
    public ResponseEntity<List<ExportTaskDto>> listTasks() {
        String tenantId = TenantContext.getTenantIdOrDefault();
        List<ExportTaskDto> dtos = exportTaskRepository.findByTenantId(tenantId).stream()
                .map(t -> ExportTaskDto.builder()
                        .id(t.getId())
                        .taskCode(t.getTaskCode())
                        .tenantId(t.getTenantId())
                        .templateId(t.getTemplateId())
                        .fileName(t.getFileName())
                        .filePath(t.getFilePath())
                        .fileSizeBytes(t.getFileSizeBytes())
                        .rowCount(t.getRowCount())
                        .status(t.getStatus())
                        .createdAt(t.getCreatedAt())
                        .expiresAt(t.getExpiresAt())
                        .createdBy(t.getCreatedBy())
                        .downloadUrl("/api/v1/reports/export/download/" + t.getTaskCode())
                        .build())
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
