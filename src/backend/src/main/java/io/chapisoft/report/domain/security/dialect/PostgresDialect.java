package io.chapisoft.report.domain.security.dialect;

import io.chapisoft.report.domain.model.DatabaseType;

import org.springframework.stereotype.Component;

@Component
public class PostgresDialect implements DatabaseDialect {

    @Override
    public DatabaseType getDatabaseType() {
        return DatabaseType.POSTGRESQL;
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

        sb.append("SELECT * FROM (").append(mainQuery).append(") AS preview_wrapper LIMIT ").append(safeLimit);
        if (safeOffset > 0) {
            sb.append(" OFFSET ").append(safeOffset);
        }

        return sb.toString();
    }
}
