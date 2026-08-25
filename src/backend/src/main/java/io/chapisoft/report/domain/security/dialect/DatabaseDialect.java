package io.chapisoft.report.domain.security.dialect;

import io.chapisoft.report.domain.model.DatabaseType;

public interface DatabaseDialect {

    DatabaseType getDatabaseType();

    String wrapPagination(String rawSql, int limit, int offset);

    default String wrapPagination(String rawSql, int limit) {
        return wrapPagination(rawSql, limit, 0);
    }
}
