package io.chapisoft.report.domain.model;

public enum DatabaseType {
    POSTGRESQL("org.postgresql.Driver", "SELECT 1"),
    ORACLE("oracle.jdbc.OracleDriver", "SELECT 1 FROM DUAL"),
    MYSQL("com.mysql.cj.jdbc.Driver", "SELECT 1"),
    SQLSERVER("com.microsoft.sqlserver.jdbc.SQLServerDriver", "SELECT 1"),
    CLICKHOUSE("com.clickhouse.jdbc.ClickHouseDriver", "SELECT 1"),
    H2("org.h2.Driver", "SELECT 1");

    private final String driverClassName;
    private final String validationQuery;

    DatabaseType(String driverClassName, String validationQuery) {
        this.driverClassName = driverClassName;
        this.validationQuery = validationQuery;
    }

    public String getDriverClassName() {
        return driverClassName;
    }

    public String getValidationQuery() {
        return validationQuery;
    }
}
