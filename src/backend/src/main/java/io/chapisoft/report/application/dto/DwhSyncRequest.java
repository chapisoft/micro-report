package io.chapisoft.report.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DwhSyncRequest {

    @NotBlank(message = "Mã kết nối CSDL (datasourceCode) không được để trống")
    private String datasourceCode;

    private String tableName;
    private String fromDate;
    private String toDate;
    private Boolean refreshMaterializedViews;
}
