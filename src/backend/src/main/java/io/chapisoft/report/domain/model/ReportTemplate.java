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
public class ReportTemplate {

    private Long id;
    private String templateCode;
    private String tenantId;
    private String datasourceCode;
    private String templateName;
    private QueryMode mode;
    private TemplateStatus status;
    private Boolean isPublic;
    private Boolean isSystem;
    private String configJson;
    private String transformJs;
    private Integer accessCount;
    private Instant lastAccessedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private Instant deletedAt;
}
