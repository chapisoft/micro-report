package io.chapisoft.report.domain.security.dialect;

import io.chapisoft.report.domain.model.DatabaseType;

import org.springframework.stereotype.Component;

@Component
public class OracleDialect implements DatabaseDialect {

    @Override
    public DatabaseType getDatabaseType() {
        return DatabaseType.ORACLE;
    }

    @Override
    public String wrapPagination(String rawSql, int limit, int offset) {
        if (rawSql == null || rawSql.trim().isEmpty()) {
            return "";
        }

        SqlCteHelper.CteSplitResult cteSplit = SqlCteHelper.splitCteAndMainQuery(rawSql);
        String mainQuery = cteSplit.mainQuery();
        int safeLimit = Math.max(limit, 1);
        int safeOffset = Math.max(offset, 0);

        StringBuilder sb = new StringBuilder();
        if (cteSplit.hasWithClause()) {
            sb.append(cteSplit.withClause()).append("\n");
        }

        if (safeOffset > 0) {
            sb.append("SELECT * FROM (").append(mainQuery).append(") OFFSET ").append(safeOffset)
                    .append(" ROWS FETCH NEXT ").append(safeLimit).append(" ROWS ONLY");
        } else {
            sb.append("SELECT * FROM (").append(mainQuery).append(") WHERE ROWNUM <= ").append(safeLimit);
        }

        return sb.toString();
    }
}
