package io.chapisoft.report.application.service;

import io.chapisoft.report.adapter.out.persistence.DataSourceRepository;
import io.chapisoft.report.application.dto.SchemaInfoDto;
import io.chapisoft.report.domain.exception.ReportEngineException;
import io.chapisoft.report.domain.exception.ResourceNotFoundException;
import io.chapisoft.report.domain.model.DataSourceConfig;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class SchemaExplorerService {

    private final DynamicDataSourceManager dataSourceManager;
    private final DataSourceRepository dataSourceRepository;

    public SchemaExplorerService(DynamicDataSourceManager dataSourceManager,
                                 DataSourceRepository dataSourceRepository) {
        this.dataSourceManager = dataSourceManager;
        this.dataSourceRepository = dataSourceRepository;
    }

    public SchemaInfoDto exploreSchema(String tenantId, String datasourceCode) {
        DataSourceConfig config = dataSourceRepository.findByTenantAndCode(tenantId, datasourceCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy cấu hình kết nối CSDL: " + datasourceCode + " cho tenant: " + tenantId));

        DataSource dataSource = dataSourceManager.getDataSource(tenantId, datasourceCode);
        List<SchemaInfoDto.TableInfo> tables = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String catalog = conn.getCatalog();
            String schema = conn.getSchema();

            try (ResultSet rsTables = metaData.getTables(catalog, schema, "%", new String[]{"TABLE", "VIEW"})) {
                while (rsTables.next()) {
                    String tableName = rsTables.getString("TABLE_NAME");
                    String tableType = rsTables.getString("TABLE_TYPE");
                    String remarks = rsTables.getString("REMARKS");

                    // Bỏ qua các bảng hệ thống
                    if (tableName.startsWith("pg_") || tableName.startsWith("sql_") || tableName.equalsIgnoreCase("information_schema")) {
                        continue;
                    }

                    List<SchemaInfoDto.ColumnInfo> columns = extractColumns(metaData, catalog, schema, tableName);

                    tables.add(SchemaInfoDto.TableInfo.builder()
                            .tableName(tableName)
                            .tableType(tableType)
                            .remarks(remarks != null ? remarks : "")
                            .columns(columns)
                            .build());
                }
            }

            return SchemaInfoDto.builder()
                    .datasourceCode(datasourceCode)
                    .databaseType(config.getDbType().name())
                    .tables(tables)
                    .build();

        } catch (SQLException e) {
            log.error("Lỗi khi quét Schema CSDL: {}", e.getMessage());
            throw new ReportEngineException("Không thể đọc danh mục Schema từ CSDL: " + e.getMessage(), e);
        }
    }

    private List<SchemaInfoDto.ColumnInfo> extractColumns(DatabaseMetaData metaData, String catalog, String schema, String tableName) throws SQLException {
        Set<String> primaryKeys = new HashSet<>();
        try (ResultSet rsPk = metaData.getPrimaryKeys(catalog, schema, tableName)) {
            while (rsPk.next()) {
                primaryKeys.add(rsPk.getString("COLUMN_NAME"));
            }
        } catch (Exception ignored) {
            // Một số DB hoặc View không hỗ trợ getPrimaryKeys
        }

        List<SchemaInfoDto.ColumnInfo> columns = new ArrayList<>();
        try (ResultSet rsCols = metaData.getColumns(catalog, schema, tableName, "%")) {
            while (rsCols.next()) {
                String colName = rsCols.getString("COLUMN_NAME");
                String typeName = rsCols.getString("TYPE_NAME");
                int colSize = rsCols.getInt("COLUMN_SIZE");
                int nullable = rsCols.getInt("NULLABLE");
                String remarks = rsCols.getString("REMARKS");

                columns.add(SchemaInfoDto.ColumnInfo.builder()
                        .columnName(colName)
                        .dataType(typeName)
                        .columnSize(colSize)
                        .nullable(nullable == DatabaseMetaData.columnNullable)
                        .isPrimaryKey(primaryKeys.contains(colName))
                        .remarks(remarks != null ? remarks : "")
                        .build());
            }
        }
        return columns;
    }
}
