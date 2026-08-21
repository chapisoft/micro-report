package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.exception.SecurityViolationException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SqlSecurityAstValidatorTest {

    private SqlSecurityAstValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SqlSecurityAstValidator();
    }

    @Test
    @DisplayName("Cho phép câu lệnh SELECT đơn giản")
    void shouldAllowSimpleSelect() {
        String sql = "SELECT id, full_name, email FROM users WHERE status = 'ACTIVE'";
        assertThatCode(() -> validator.validateSafeSql(sql))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Cho phép câu lệnh SELECT có JOIN và GROUP BY")
    void shouldAllowSelectWithJoinAndGroupBy() {
        String sql = """
            SELECT u.department_id, COUNT(u.id) AS total_users, SUM(p.amount) AS total_revenue
            FROM users u
            JOIN payments p ON u.id = p.user_id
            WHERE p.paid_at >= '2026-01-01'
            GROUP BY u.department_id
            HAVING COUNT(u.id) > 10
            ORDER BY total_revenue DESC
            """;
        assertThatCode(() -> validator.validateSafeSql(sql))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Cho phép câu lệnh CTE (WITH ... SELECT)")
    void shouldAllowCteQuery() {
        String sql = """
            WITH MonthlyTotals AS (
                SELECT province_code, SUM(amount) AS revenue
                FROM fact_transactions
                WHERE created_at >= '2026-01-01'
                GROUP BY province_code
            )
            SELECT province_code, revenue, RANK() OVER (ORDER BY revenue DESC) as rank_pos
            FROM MonthlyTotals
            """;
        assertThatCode(() -> validator.validateSafeSql(sql))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Cho phép câu lệnh SELECT có nhúng tham số dynamic {{params.startDate}}")
    void shouldAllowSelectWithDynamicParameters() {
        String sql = "SELECT * FROM orders WHERE order_date >= {{params.startDate}} AND total >= {{params.minAmount}}";
        assertThatCode(() -> validator.validateSafeSql(sql))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "DROP TABLE users",
            "DELETE FROM orders WHERE id = 1",
            "UPDATE accounts SET balance = balance + 1000",
            "INSERT INTO audit_logs (action) VALUES ('HACK')",
            "TRUNCATE TABLE payment_records",
            "ALTER TABLE users ADD COLUMN is_admin BOOLEAN",
            "GRANT ALL PRIVILEGES ON DATABASE mydb TO hacker",
            "REVOKE ALL ON users FROM admin",
            "EXEC xp_cmdshell('dir')",
            "CALL do_something()"
    })
    @DisplayName("Chặn 100% các câu lệnh DML/DDL độc hại")
    void shouldBlockDangerousDmlDdl(String dangerousSql) {
        assertThatThrownBy(() -> validator.validateSafeSql(dangerousSql))
                .isInstanceOf(SecurityViolationException.class);
    }

    @Test
    @DisplayName("Chặn tấn công xếp chồng lệnh (Multi-statement / Stacked queries)")
    void shouldBlockMultiStatementStackedQueries() {
        String sql = "SELECT 1; DROP TABLE users;";
        assertThatThrownBy(() -> validator.validateSafeSql(sql))
                .isInstanceOf(SecurityViolationException.class)
                .hasMessageContaining("Chỉ cho phép thực thi một câu lệnh truy vấn đơn lẻ");
    }

    @Test
    @DisplayName("Chặn câu lệnh SELECT INTO ghi đè bảng")
    void shouldBlockSelectInto() {
        String sql = "SELECT * INTO backup_users FROM users";
        assertThatThrownBy(() -> validator.validateSafeSql(sql))
                .isInstanceOf(SecurityViolationException.class)
                .hasMessageContaining("SELECT INTO");
    }
}
