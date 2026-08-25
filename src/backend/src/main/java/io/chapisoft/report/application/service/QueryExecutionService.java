package io.chapisoft.report.application.service;

import io.chapisoft.report.application.dto.QueryPreviewRequest;
import io.chapisoft.report.application.dto.QueryPreviewResponse;
import io.chapisoft.report.domain.exception.ReportEngineException;
import io.chapisoft.report.domain.model.DatabaseType;
import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.security.BoundSql;
import io.chapisoft.report.domain.security.DynamicParameterBinder;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;
import io.chapisoft.report.domain.security.dialect.DatabaseDialect;
import io.chapisoft.report.domain.security.dialect.DatabaseDialectFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
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
    private final DatabaseDialectFactory dialectFactory;
    private final ObjectMapper objectMapper;

    public QueryExecutionService(DynamicDataSourceManager dataSourceManager,
            SqlSecurityAstValidator sqlSecurityAstValidator,
            DynamicParameterBinder parameterBinder,
            DatabaseDialectFactory dialectFactory,
            ObjectMapper objectMapper) {
        this.dataSourceManager = dataSourceManager;
        this.sqlSecurityAstValidator = sqlSecurityAstValidator;
        this.parameterBinder = parameterBinder;
        this.dialectFactory = dialectFactory;
        this.objectMapper = objectMapper;
    }

    public QueryPreviewResponse executePreview(String tenantId, QueryPreviewRequest request) {
        long startTime = System.currentTimeMillis();
        String rawSql;

        // Ưu tiên sử dụng SQL đã được frontend biên dịch hoặc chế độ SQL
        if (request.getSql() != null && !request.getSql().trim().isEmpty()) {
            rawSql = request.getSql();
        } else if (request.getMode() == QueryMode.SQL) {
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

        // 3. Áp dụng giới hạn dòng preview (mặc định 50 dòng, tối đa 500 dòng) qua
        // DatabaseDialect
        int limit = (request.getLimit() != null && request.getLimit() > 0
                && request.getLimit() <= ReportConstants.MAX_PREVIEW_LIMIT)
                        ? request.getLimit()
                        : ReportConstants.DEFAULT_PREVIEW_LIMIT;

        DatabaseType dbType = dataSourceManager.getDatabaseType(tenantId, request.getDatasourceCode());
        DatabaseDialect dialect = dialectFactory.getDialect(dbType);
        String limitedSql = dialect.wrapPagination(boundSql.sql(), limit, 0);

        NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId,
                request.getDatasourceCode());

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
        String trimmed = configJson.trim();
        if (trimmed.startsWith("SELECT") || trimmed.startsWith("WITH") || trimmed.startsWith("select")
                || trimmed.startsWith("with")) {
            return trimmed;
        }

        try {
            JsonNode root = objectMapper.readTree(trimmed);
            String primaryTable = root.path("primaryTable").asText(null);
            if (primaryTable == null || primaryTable.trim().isEmpty()) {
                return "SELECT 1 AS status";
            }

            StringBuilder selectClause = new StringBuilder();
            JsonNode cols = root.path("columns");
            if (cols.isArray() && cols.size() > 0) {
                for (int i = 0; i < cols.size(); i++) {
                    JsonNode col = cols.get(i);
                    String tbl = col.path("tableName").asText(primaryTable);
                    String colName = col.path("columnName").asText("*");
                    String agg = col.path("aggregation").asText(null);
                    String alias = col.path("alias").asText(null);

                    if (i > 0)
                        selectClause.append(", ");
                    String colExpr = tbl + "." + colName;
                    if (agg != null && !agg.equalsIgnoreCase("NONE") && !agg.trim().isEmpty()) {
                        colExpr = agg + "(" + colExpr + ")";
                    }
                    selectClause.append(colExpr);
                    if (alias != null && !alias.trim().isEmpty() && !alias.equalsIgnoreCase(colName)) {
                        String cleanAlias = alias.trim().replace("\"", "");
                        selectClause.append(" AS \"").append(cleanAlias).append("\"");
                    }
                }
            } else {
                selectClause.append("*");
            }

            StringBuilder sql = new StringBuilder("SELECT ").append(selectClause).append(" FROM ").append(primaryTable);

            // Joins
            JsonNode joins = root.path("joins");
            if (joins.isArray()) {
                for (JsonNode j : joins) {
                    String jType = j.path("joinType").asText("INNER");
                    String sTable = j.path("sourceTable").asText(primaryTable);
                    String sCol = j.path("sourceColumn").asText();
                    String tTable = j.path("targetTable").asText();
                    String tCol = j.path("targetColumn").asText();

                    if (!tTable.isEmpty() && !sCol.isEmpty() && !tCol.isEmpty()) {
                        sql.append("\n").append(jType).append(" JOIN ").append(tTable)
                                .append(" ON ").append(sTable).append(".").append(sCol)
                                .append(" = ").append(tTable).append(".").append(tCol);
                    }
                }
            }

            // Filters
            JsonNode filters = root.path("filters");
            if (filters.isArray() && filters.size() > 0) {
                sql.append("\nWHERE ");
                for (int i = 0; i < filters.size(); i++) {
                    JsonNode f = filters.get(i);
                    String fLogic = f.path("logic").asText("AND");
                    String fTable = f.path("tableName").asText(primaryTable);
                    String fCol = f.path("columnName").asText();
                    String fOp = f.path("operator").asText("=");
                    String fVal = f.path("value").asText("");

                    if (i > 0) {
                        sql.append(" ").append(fLogic).append(" ");
                    }
                    if (fOp.equalsIgnoreCase("IS NULL") || fOp.equalsIgnoreCase("IS NOT NULL")) {
                        sql.append(fTable).append(".").append(fCol).append(" ").append(fOp);
                    } else if (fVal.startsWith("{{") && fVal.endsWith("}}")) {
                        sql.append(fTable).append(".").append(fCol).append(" ").append(fOp).append(" ").append(fVal);
                    } else {
                        sql.append(fTable).append(".").append(fCol).append(" ").append(fOp).append(" '").append(fVal)
                                .append("'");
                    }
                }
            }

            return sql.toString();
        } catch (Exception e) {
            log.warn("Không thể parse configJson sang SQL: {}", e.getMessage());
            return "SELECT 1 AS status";
        }
    }
}
