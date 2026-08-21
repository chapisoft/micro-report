package io.chapisoft.report.application.dto;

import io.chapisoft.report.domain.model.QueryMode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryPreviewRequest {

    @NotBlank(message = "Mã kết nối CSDL (datasourceCode) không được để trống")
    private String datasourceCode;

    @NotNull(message = "Chế độ truy vấn (mode) không được để trống")
    private QueryMode mode;

    private String sql;
    private String configJson;
    private String transformJs;
    private Map<String, Object> params;
    private Integer limit;
}
