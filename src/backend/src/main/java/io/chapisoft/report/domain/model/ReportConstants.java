package io.chapisoft.report.domain.model;

public final class ReportConstants {

    private ReportConstants() {
        // Utility / Constants class
    }

    public static final String DEFAULT_TENANT_ID = "DEFAULT";
    public static final String FILTER_ALL = "all";
    public static final String HEADER_TENANT_ID = "X-Tenant-Id";
    public static final String HEADER_API_KEY = "X-API-Key";
    public static final String CREATED_BY_SYSTEM = "SYSTEM";
    public static final String CREATED_BY_ANONYMOUS = "ANONYMOUS";

    public static final int DEFAULT_MAX_POOL_SIZE = 10;
    public static final int DEFAULT_STATEMENT_TIMEOUT_SECONDS = 30;
    public static final int DEFAULT_PREVIEW_LIMIT = 50;
    public static final int DEFAULT_EXPORT_MAX_ROWS = 100000;
    public static final int SXSSF_WINDOW_SIZE = 500;
}
