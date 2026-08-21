package io.chapisoft.report.domain.security;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;

import java.util.Map;

public record BoundSql(
        String sql,
        MapSqlParameterSource parameterSource,
        Map<String, Object> rawParams
) {
}
