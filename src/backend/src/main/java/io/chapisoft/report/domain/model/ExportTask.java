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
public class ExportTask {

    private Long id;
    private String taskCode;
    private String tenantId;
    private Long templateId;
    private String fileName;
    private String filePath;
    private Long fileSizeBytes;
    private Integer rowCount;
    private TaskStatus status;
    private Instant createdAt;
    private Instant expiresAt;
    private String createdBy;
}
