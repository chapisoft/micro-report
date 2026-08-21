package io.chapisoft.report.application.service;

import io.chapisoft.report.application.dto.QueryPreviewRequest;
import io.chapisoft.report.application.dto.QueryPreviewResponse;
import io.chapisoft.report.domain.exception.ReportEngineException;
import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.security.BoundSql;
import io.chapisoft.report.domain.security.DynamicParameterBinder;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
public class QueryExecutionService {

    private final DynamicDataSourceManager dataSourceManager;
    private final SqlSecurityAstValidator sqlSecurityAstValidator;
    private final DynamicParameterBinder parameterBinder;

    public QueryExecutionService(DynamicDataSourceManager dataSourceManager,
                                 SqlSecurityAstValidator sqlSecurityAstValidator,
                                 DynamicParameterBinder parameterBinder) {
        this.dataSourceManager = dataSourceManager;
        this.sqlSecurityAstValidator = sqlSecurityAstValidator;
        this.parameterBinder = parameterBinder;
    }

    public QueryPreviewResponse executePreview(String tenantId, QueryPreviewRequest request) {
        long startTime = System.currentTimeMillis();
        String rawSql;

        if (request.getMode() == QueryMode.SQL) {
            rawSql = request.getSql();
        } else {
            rawSql = generateSqlFromGuiConfig(request.getConfigJson());
        }

        if (rawSql == null || rawSql.trim().isEmpty()) {
            throw new ReportEngineException("Câu lệnh truy vấn không được để trống.");
        }

        // 1. Phân tích an toàn qua JSqlParser AST Sandbox
        sqlSecurityAstValidator.validateSafeSql(rawSql);

        // 2. Chuyển đổi tham số động {{params.var}} thành Named Parameters :param_var
        BoundSql boundSql = parameterBinder.bind(rawSql, request.getParams());

        // 3. Áp dụng giới hạn dòng preview (mặc định 50 dòng)
        int limit = (request.getLimit() != null && request.getLimit() > 0 && request.getLimit() <= 500) 
                ? request.getLimit() : 50;
        
        String limitedSql = "SELECT * FROM (" + boundSql.sql() + ") AS preview_wrapper LIMIT " + limit;

        NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId, request.getDatasourceCode());

        List<String> columns = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();

        try {
            jdbcTemplate.query(limitedSql, Objects.requireNonNull(boundSql.parameterSource()), rs -> {
                ResultSetMetaData metaData = rs.getMetaData();
                int colCount = metaData.getColumnCount();

                if (columns.isEmpty()) {
                    for (int i = 1; i <= colCount; i++) {
                        columns.add(metaData.getColumnLabel(i));
                    }
                }

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= colCount; i++) {
                        String colName = metaData.getColumnLabel(i);
                        row.put(colName, rs.getObject(i));
                    }
                    rows.add(row);
                }
                return rows;
            });

            long executionTimeMs = System.currentTimeMillis() - startTime;

            return QueryPreviewResponse.builder()
                    .columns(columns)
                    .rows(rows)
                    .totalRows((long) rows.size())
                    .executionTimeMs(executionTimeMs)
                    .generatedSql(boundSql.sql())
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi thực thi câu lệnh SQL: {}", e.getMessage());
            throw new ReportEngineException("Lỗi thực thi truy vấn trên CSDL đích: " + e.getMessage(), e);
        }
    }

    public String generateSqlFromGuiConfig(String configJson) {
        if (configJson == null || configJson.trim().isEmpty()) {
            return "SELECT 1 AS status";
        }
        // Trả về SQL từ configJson nếu nó chứa SQL, hoặc sinh SQL đơn giản
        if (configJson.trim().startsWith("SELECT") || configJson.trim().startsWith("WITH")) {
            return configJson;
        }
        // Trường hợp configJson là JSON cấu hình visual builder
        return configJson;
    }
}
