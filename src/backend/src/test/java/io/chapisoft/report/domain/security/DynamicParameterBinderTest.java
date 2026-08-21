package io.chapisoft.report.domain.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DynamicParameterBinderTest {

    private DynamicParameterBinder parameterBinder;

    @BeforeEach
    void setUp() {
        parameterBinder = new DynamicParameterBinder();
    }

    @Test
    @DisplayName("Chuyển đổi đúng biến {{params.var}} thành :param_var")
    void shouldBindParametersCorrectly() {
        String sql = "SELECT * FROM transactions WHERE created_at >= {{params.startDate}} AND status = {{params.status}}";
        Map<String, Object> params = Map.of(
                "startDate", "2026-08-01 00:00:00",
                "status", "COMPLETED"
        );

        BoundSql boundSql = parameterBinder.bind(sql, params);

        assertThat(boundSql.sql()).isEqualTo("SELECT * FROM transactions WHERE created_at >= :param_startDate AND status = :param_status");
        assertThat(boundSql.parameterSource().getValue("param_startDate")).isEqualTo("2026-08-01 00:00:00");
        assertThat(boundSql.parameterSource().getValue("param_status")).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("Xử lý an toàn khi không có tham số đầu vào")
    void shouldHandleEmptyParamsSafely() {
        String sql = "SELECT * FROM products WHERE price > {{params.minPrice}}";
        BoundSql boundSql = parameterBinder.bind(sql, null);

        assertThat(boundSql.sql()).isEqualTo("SELECT * FROM products WHERE price > :param_minPrice");
        assertThat(boundSql.parameterSource().hasValue("param_minPrice")).isTrue();
        assertThat(boundSql.parameterSource().getValue("param_minPrice")).isNull();
    }
}
