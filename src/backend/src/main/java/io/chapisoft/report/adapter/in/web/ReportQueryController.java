package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.application.dto.QueryPreviewRequest;
import io.chapisoft.report.application.dto.QueryPreviewResponse;
import io.chapisoft.report.application.service.QueryExecutionService;
import io.chapisoft.report.domain.model.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "4. Query & Preview", description = "Thực thi xem trước dữ liệu báo cáo thời gian thực")
@RestController
@RequestMapping("/api/v1/reports")
public class ReportQueryController {

    private final QueryExecutionService queryExecutionService;

    public ReportQueryController(QueryExecutionService queryExecutionService) {
        this.queryExecutionService = queryExecutionService;
    }

    @Operation(summary = "Xem trước kết quả truy vấn (Tối đa 50 dòng, AST Sandbox kiểm duyệt)")
    @PostMapping("/preview")
    public ResponseEntity<QueryPreviewResponse> previewQuery(@Valid @RequestBody QueryPreviewRequest request) {
        String tenantId = TenantContext.getTenantIdOrDefault();
        QueryPreviewResponse response = queryExecutionService.executePreview(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
