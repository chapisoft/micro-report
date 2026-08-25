package io.chapisoft.report.application.service;

import io.chapisoft.report.domain.security.DynamicParameterBinder;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;
import io.chapisoft.report.domain.security.dialect.DatabaseDialectFactory;
import io.chapisoft.report.domain.security.dialect.OracleDialect;
import io.chapisoft.report.domain.security.dialect.PostgresDialect;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class QueryExecutionServiceTest {

    @Mock
    private DynamicDataSourceManager dataSourceManager;

    private SqlSecurityAstValidator sqlSecurityAstValidator;
    private DynamicParameterBinder parameterBinder;
    private DatabaseDialectFactory dialectFactory;
    private ObjectMapper objectMapper;
    private QueryExecutionService queryExecutionService;

    @BeforeEach
    void setUp() {
        sqlSecurityAstValidator = new SqlSecurityAstValidator();
        parameterBinder = new DynamicParameterBinder();
        PostgresDialect postgresDialect = new PostgresDialect();
        OracleDialect oracleDialect = new OracleDialect();
        dialectFactory = new DatabaseDialectFactory(List.of(postgresDialect, oracleDialect), postgresDialect);
        objectMapper = new ObjectMapper();

        queryExecutionService = new QueryExecutionService(
                dataSourceManager,
                sqlSecurityAstValidator,
                parameterBinder,
                dialectFactory,
                objectMapper
        );
    }

    @Test
    @DisplayName("GUI Builder: Tự động bọc ngoặc kép quanh Alias tiếng Việt có dấu cách (BUG-01)")
    void shouldQuoteVietnameseAliasesInGuiConfig() {
        String guiJson = """
            {
                "primaryTable": "fact_dossiers",
                "columns": [
                    {
                        "tableName": "fact_dossiers",
                        "columnName": "total_amount",
                        "alias": "Doanh thu tháng 8",
                        "aggregation": "SUM"
                    },
                    {
                        "tableName": "fact_dossiers",
                        "columnName": "dossier_type",
                        "alias": "Loại hồ sơ",
                        "aggregation": "NONE"
                    }
                ]
            }
            """;

        String generatedSql = queryExecutionService.generateSqlFromGuiConfig(guiJson);

        assertThat(generatedSql)
                .contains("SUM(fact_dossiers.total_amount) AS \"Doanh thu tháng 8\"")
                .contains("fact_dossiers.dossier_type AS \"Loại hồ sơ\"")
                .contains("FROM fact_dossiers");
    }

    @Test
    @DisplayName("GUI Builder: Trả về câu SQL thô nếu configJson đã là dạng câu truy vấn SQL")
    void shouldReturnRawSqlWhenGivenSqlString() {
        String rawSql = "SELECT dossier_id, total_amount FROM fact_dossiers WHERE status = 'PAID'";
        String result = queryExecutionService.generateSqlFromGuiConfig(rawSql);

        assertThat(result).isEqualTo(rawSql);
    }
}
