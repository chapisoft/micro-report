package io.chapisoft.report.application.dto;

import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.TemplateStatus;

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
public class ReportTemplateDto {

    private Long id;

    @NotBlank(message = "Mã mẫu báo cáo không được để trống")
    private String templateCode;

    private String tenantId;

    @NotBlank(message = "Mã kết nối CSDL không được để trống")
    private String datasourceCode;

    @NotBlank(message = "Tên mẫu báo cáo không được để trống")
    private String templateName;

    @NotNull(message = "Chế độ (mode: GUI hoặc SQL) không được để trống")
    private QueryMode mode;

    private TemplateStatus status;
    private Boolean isPublic;
    private Boolean isSystem;

    @NotBlank(message = "Cấu hình JSON không được để trống")
    private String configJson;

    private String transformJs;
    private Integer accessCount;
    private Instant lastAccessedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;

    // Menu Integration Metadata (CMS DIP / Micro-CRM)
    private String menuPath;
    private String menuCategory;
    private String menuIcon;
}
