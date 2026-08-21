package io.chapisoft.report.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchemaInfoDto {

    private String datasourceCode;
    private String databaseType;
    private List<TableInfo> tables;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableInfo {
        private String tableName;
        private String tableType; // TABLE, VIEW
        private String remarks;
        private List<ColumnInfo> columns;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnInfo {
        private String columnName;
        private String dataType;
        private Integer columnSize;
        private Boolean nullable;
        private Boolean isPrimaryKey;
        private String remarks;
    }
}
