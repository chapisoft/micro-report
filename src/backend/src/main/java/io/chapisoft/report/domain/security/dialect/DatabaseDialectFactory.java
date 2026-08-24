package io.chapisoft.report.domain.security.dialect;

import io.chapisoft.report.domain.model.DatabaseType;

import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class DatabaseDialectFactory {

    private final Map<DatabaseType, DatabaseDialect> dialectMap = new EnumMap<>(DatabaseType.class);
    private final DatabaseDialect defaultDialect;

    public DatabaseDialectFactory(List<DatabaseDialect> dialects, PostgresDialect defaultDialect) {
        this.defaultDialect = defaultDialect;
        for (DatabaseDialect dialect : dialects) {
            dialectMap.put(dialect.getDatabaseType(), dialect);
        }
    }

    public DatabaseDialect getDialect(DatabaseType dbType) {
        if (dbType == null) {
            return defaultDialect;
        }
        return dialectMap.getOrDefault(dbType, defaultDialect);
    }
}
