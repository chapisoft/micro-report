package io.chapisoft.report.domain.security;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DynamicParameterBinder {

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\{\\{params\\.([a-zA-Z0-9_]+)\\}\\}");

    public BoundSql bind(String rawSql, Map<String, Object> inputParams) {
        if (rawSql == null) {
            return new BoundSql("", new MapSqlParameterSource(), Collections.emptyMap());
        }

        Map<String, Object> safeParams = inputParams != null ? inputParams : Collections.emptyMap();
        Matcher matcher = PARAM_PATTERN.matcher(rawSql);
        StringBuilder sqlBuffer = new StringBuilder();
        MapSqlParameterSource paramSource = new MapSqlParameterSource();

        while (matcher.find()) {
            String paramName = matcher.group(1);
            Object paramValue = safeParams.get(paramName);
            String namedParam = "param_" + paramName;

            matcher.appendReplacement(sqlBuffer, ":" + namedParam);
            paramSource.addValue(namedParam, paramValue);
        }
        matcher.appendTail(sqlBuffer);

        return new BoundSql(sqlBuffer.toString(), paramSource, safeParams);
    }
}
