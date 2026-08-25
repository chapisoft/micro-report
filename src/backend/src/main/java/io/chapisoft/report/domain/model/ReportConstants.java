package io.chapisoft.report.domain.model;

public final class ReportConstants {

    private ReportConstants() {
        // Utility / Constants class
    }

    public static final String DEFAULT_TENANT_ID = "DEFAULT";
    public static final String FILTER_ALL = "all";
    public static final String HEADER_TENANT_ID = "X-Tenant-Id";
    public static final String HEADER_API_KEY = "X-API-Key";
    public static final String HEADER_DATA_SCOPE = "X-Data-Scope";
    public static final String HEADER_ALLOWED_DATASOURCES = "X-Allowed-DataSources";
    public static final String HEADER_BRANCH_ID = "X-Branch-Id";
    public static final String HEADER_PROVINCE_CODE = "X-Province-Code";
    public static final String BEARER_PREFIX = "Bearer ";

    public static final String CLAIM_TENANT_ID = "tenant_id";
    public static final String CLAIM_USER_NAME = "user_name";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_DATA_SCOPE = "data_scope";
    public static final String CLAIM_ALLOWED_DATASOURCES = "allowed_datasources";
    public static final String CLAIM_BRANCH_ID = "branch_id";
    public static final String CLAIM_PROVINCE_CODE = "province_code";

    public static final String CREATED_BY_SYSTEM = "SYSTEM";
    public static final String CREATED_BY_ANONYMOUS = "ANONYMOUS";
    public static final String DEFAULT_SYSTEM_USER_NAME = "System User";
    public static final String DEFAULT_ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ROLE_DATA_MANAGER = "DATA_MANAGER";

    public static final String SCOPE_PARAM_PREFIX = "scope_";
    public static final String SCOPE_BRANCH_ID = "branch_id";
    public static final String SCOPE_PROVINCE_CODE = "province_code";
    public static final String SCOPE_ALL = "all";

    public static final String DEFAULT_MENU_CATEGORY = "Báo cáo nghiệp vụ";
    public static final String DEFAULT_MENU_ICON = "FileText";
    public static final String DEFAULT_MENU_PATH_PREFIX = "/reports/custom/";

    public static final int DEFAULT_MAX_POOL_SIZE = 10;
    public static final int DEFAULT_HIKARI_MAX_POOL_SIZE_FALLBACK = 5;
    public static final int DEFAULT_HIKARI_MIN_IDLE = 1;
    public static final int DEFAULT_HIKARI_CONNECTION_TIMEOUT_MS = 10000;
    public static final int DEFAULT_HIKARI_VALIDATION_TIMEOUT_MS = 3000;

    public static final int DEFAULT_STATEMENT_TIMEOUT_SECONDS = 30;
    public static final int DEFAULT_PREVIEW_LIMIT = 50;
    public static final int MAX_PREVIEW_LIMIT = 500;
    public static final int DEFAULT_EXPORT_MAX_ROWS = 100000;
    public static final int SXSSF_WINDOW_SIZE = 500;

    public static final long DEFAULT_EXPORT_EXPIRATION_HOURS = 24L;
    public static final String DEFAULT_SHEET_NAME = "Report Data";
    public static final String PREFIX_TASK_CODE = "EXP_";
    public static final String DEFAULT_FILE_NAME_PREFIX = "BaoCao_";
    public static final String EXTENSION_EXCEL = ".xlsx";
    public static final String EXTENSION_CSV = ".csv";
    public static final char UTF8_BOM = '\ufeff';

    public static final int DEFAULT_RATE_LIMIT_CAPACITY = 120;
    public static final int DEFAULT_RATE_LIMIT_REFILL_TOKENS = 120;
    public static final int DEFAULT_RATE_LIMIT_REFILL_MINUTES = 1;
    public static final String MSG_TOO_MANY_REQUESTS = "Bạn đã vượt quá giới hạn 120 yêu cầu/phút. Vui lòng thử lại sau.";
}
