package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.model.DatabaseType;
import io.chapisoft.report.domain.security.dialect.DatabaseDialect;
import io.chapisoft.report.domain.security.dialect.DatabaseDialectFactory;
import io.chapisoft.report.domain.security.dialect.OracleDialect;
import io.chapisoft.report.domain.security.dialect.PostgresDialect;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseDialectTest {

    private PostgresDialect postgresDialect;
    private OracleDialect oracleDialect;
    private DatabaseDialectFactory dialectFactory;

    @BeforeEach
    void setUp() {
        postgresDialect = new PostgresDialect();
        oracleDialect = new OracleDialect();
        dialectFactory = new DatabaseDialectFactory(List.of(postgresDialect, oracleDialect), postgresDialect);
    }

    @Test
    @DisplayName("PostgreSQL: Phân trang câu lệnh SELECT đơn giản với LIMIT")
    void testPostgresSimplePagination() {
        String sql = "SELECT id, name FROM users WHERE status = 'ACTIVE'";
        String paginated = postgresDialect.wrapPagination(sql, 50, 0);

        assertThat(paginated)
                .isEqualTo("SELECT * FROM (SELECT id, name FROM users WHERE status = 'ACTIVE') AS preview_wrapper LIMIT 50");
    }

    @Test
    @DisplayName("PostgreSQL: Phân trang có OFFSET")
    void testPostgresPaginationWithOffset() {
        String sql = "SELECT * FROM orders";
        String paginated = postgresDialect.wrapPagination(sql, 20, 40);

        assertThat(paginated)
                .isEqualTo("SELECT * FROM (SELECT * FROM orders) AS preview_wrapper LIMIT 20 OFFSET 40");
    }

    @Test
    @DisplayName("PostgreSQL: Tách mệnh đề WITH CTE lên đầu trước khi bọc LIMIT (BUG-05)")
    void testPostgresCtePagination() {
        String sql = "WITH monthly AS (SELECT user_id, SUM(amount) AS total FROM txns GROUP BY user_id) SELECT * FROM monthly ORDER BY total DESC";
        String paginated = postgresDialect.wrapPagination(sql, 50, 0);

        assertThat(paginated)
                .startsWith("WITH monthly AS (SELECT user_id, SUM(amount) AS total FROM txns GROUP BY user_id)")
                .contains("SELECT * FROM (SELECT * FROM monthly ORDER BY total DESC) AS preview_wrapper LIMIT 50");
    }

    @Test
    @DisplayName("Oracle: Phân trang câu lệnh SELECT dùng ROWNUM khi offset <= 0 (BUG-02)")
    void testOracleSimplePaginationRownum() {
        String sql = "SELECT id, name FROM users WHERE status = 'ACTIVE'";
        String paginated = oracleDialect.wrapPagination(sql, 50, 0);

        assertThat(paginated)
                .isEqualTo("SELECT * FROM (SELECT id, name FROM users WHERE status = 'ACTIVE') WHERE ROWNUM <= 50");
    }

    @Test
    @DisplayName("Oracle: Phân trang dùng OFFSET n ROWS FETCH NEXT m ROWS ONLY khi offset > 0")
    void testOraclePaginationWithOffset() {
        String sql = "SELECT * FROM orders";
        String paginated = oracleDialect.wrapPagination(sql, 20, 40);

        assertThat(paginated)
                .isEqualTo("SELECT * FROM (SELECT * FROM orders) OFFSET 40 ROWS FETCH NEXT 20 ROWS ONLY");
    }

    @Test
    @DisplayName("Oracle: Tách mệnh đề WITH CTE lên đầu trước khi bọc ROWNUM (BUG-05)")
    void testOracleCtePagination() {
        String sql = "WITH monthly AS (SELECT user_id, SUM(amount) AS total FROM txns GROUP BY user_id) SELECT * FROM monthly ORDER BY total DESC";
        String paginated = oracleDialect.wrapPagination(sql, 50, 0);

        assertThat(paginated)
                .startsWith("WITH monthly AS (SELECT user_id, SUM(amount) AS total FROM txns GROUP BY user_id)")
                .contains("SELECT * FROM (SELECT * FROM monthly ORDER BY total DESC) WHERE ROWNUM <= 50");
    }

    @Test
    @DisplayName("DialectFactory: Trả về đúng Dialect theo DatabaseType và fallback mặc định")
    void testDialectFactoryResolution() {
        DatabaseDialect oracle = dialectFactory.getDialect(DatabaseType.ORACLE);
        assertThat(oracle).isInstanceOf(OracleDialect.class);

        DatabaseDialect postgres = dialectFactory.getDialect(DatabaseType.POSTGRESQL);
        assertThat(postgres).isInstanceOf(PostgresDialect.class);

        DatabaseDialect h2 = dialectFactory.getDialect(DatabaseType.H2);
        assertThat(h2).isInstanceOf(PostgresDialect.class);

        DatabaseDialect fallbackNull = dialectFactory.getDialect(null);
        assertThat(fallbackNull).isInstanceOf(PostgresDialect.class);
    }
}
