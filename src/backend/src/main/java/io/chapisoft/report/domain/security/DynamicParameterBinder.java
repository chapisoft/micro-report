package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DynamicParameterBinder {

    private static final Pattern PARAM_PATTERN = Pattern.compile("\\{\\{params\\.([a-zA-Z0-9_]+)\\}\\}");
    private static final Pattern SCOPE_PATTERN = Pattern.compile("\\{\\{scope\\.([a-zA-Z0-9_]+)\\}\\}");

    public BoundSql bind(String rawSql, Map<String, Object> inputParams) {
        if (rawSql == null) {
            return new BoundSql("", new MapSqlParameterSource(), Collections.emptyMap());
        }

        Map<String, Object> safeParams = inputParams != null ? new HashMap<>(inputParams) : new HashMap<>();
        MapSqlParameterSource paramSource = new MapSqlParameterSource();

        // 1. Tự động nạp Scope từ TenantContext (Row-Level Security)
        TenantContext ctx = TenantContext.get();
        if (ctx != null) {
            Map<String, Object> dataScope = ctx.getDataScope();
            for (Map.Entry<String, Object> entry : dataScope.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    String scopeKey = ReportConstants.SCOPE_PARAM_PREFIX + entry.getKey();
                    paramSource.addValue(scopeKey, entry.getValue());
                    safeParams.put(scopeKey, entry.getValue());
                }
            }
        }

        // 2. Thay thế biến {{scope.var}} thành :scope_var
        Matcher scopeMatcher = SCOPE_PATTERN.matcher(rawSql);
        StringBuilder scopeBuffer = new StringBuilder();
        while (scopeMatcher.find()) {
            String scopeKey = scopeMatcher.group(1);
            String namedParam = ReportConstants.SCOPE_PARAM_PREFIX + scopeKey;
            Object scopeVal = (ctx != null) ? ctx.getDataScope().get(scopeKey) : null;

            scopeMatcher.appendReplacement(scopeBuffer, ":" + namedParam);
            paramSource.addValue(namedParam, scopeVal);
            safeParams.put(namedParam, scopeVal);
        }
        scopeMatcher.appendTail(scopeBuffer);

        String intermediateSql = scopeBuffer.toString();

        // 3. Thay thế biến {{params.var}} thành :param_var
        Matcher paramMatcher = PARAM_PATTERN.matcher(intermediateSql);
        StringBuilder finalSqlBuffer = new StringBuilder();

        while (paramMatcher.find()) {
            String paramName = paramMatcher.group(1);
            Object paramValue = safeParams.get(paramName);
            String namedParam = "param_" + paramName;

            paramMatcher.appendReplacement(finalSqlBuffer, ":" + namedParam);
            paramSource.addValue(namedParam, paramValue);
        }
        paramMatcher.appendTail(finalSqlBuffer);

        return new BoundSql(finalSqlBuffer.toString(), paramSource, Collections.unmodifiableMap(safeParams));
    }
}
