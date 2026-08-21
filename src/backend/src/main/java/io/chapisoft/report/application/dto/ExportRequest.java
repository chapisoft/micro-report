package io.chapisoft.report.application.dto;

import io.chapisoft.report.domain.model.QueryMode;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequest {

    @NotBlank(message = "Mã kết nối CSDL không được để trống")
    private String datasourceCode;

    private Long templateId;
    private String templateCode;
    private QueryMode mode;
    private String sql;
    private String configJson;
    private String transformJs;
    private Map<String, Object> params;
    private String fileName;
}
