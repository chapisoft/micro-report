export enum QueryMode {
  GUI = "GUI",
  SQL = "SQL",
}

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
}

export const BUILDER_CONSTANTS = {
  DEFAULT_TENANT_ID: "DEFAULT",
  DEFAULT_PAGE_SIZE: 50,
  DEFAULT_PREVIEW_LIMIT: 50,
  FILTER_ALL: "all",
  DEFAULT_TEMPLATE_NAME: "Custom Report",
  DEFAULT_TENANT_NAME: "HỆ THỐNG ĐỐI SOÁT & BÁO CÁO DOANH NGHIỆP",
  DEFAULT_REPORT_NUMBER: "BC-RPT-01/AUTO",
  // Titles (Chức danh — người dùng tự chỉnh được)
  DEFAULT_SIGNER_TITLE: "Người Lập Biểu",
  DEFAULT_ACCOUNTANT_TITLE: "Kế Toán Trưởng",
  DEFAULT_DIRECTOR_TITLE: "Thủ Trưởng Đơn Vị",
  // Names (Tên người ký — người dùng tự điền)
  DEFAULT_SIGNER_NAME: "",
  DEFAULT_ACCOUNTANT_NAME: "",
  DEFAULT_DIRECTOR_NAME: "",
} as const;

export enum TemplateStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum TaskStatus {
  PROCESSING = "PROCESSING",
  READY = "READY",
  EXPIRED = "EXPIRED",
  FAILED = "FAILED",
}

export enum ExportFormat {
  EXCEL = "EXCEL",
  CSV = "CSV",
  PDF = "PDF",
}

export enum DatabaseType {
  POSTGRESQL = "POSTGRESQL",
  ORACLE = "ORACLE",
  MYSQL = "MYSQL",
  SQLSERVER = "SQLSERVER",
  CLICKHOUSE = "CLICKHOUSE",
  H2 = "H2",
}

export enum AggregationType {
  NONE = "NONE",
  SUM = "SUM",
  COUNT = "COUNT",
  AVG = "AVG",
  MIN = "MIN",
  MAX = "MAX",
}

export enum JoinType {
  INNER = "INNER",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export enum FilterOperator {
  EQUALS = "=",
  NOT_EQUALS = "!=",
  GREATER_THAN = ">",
  GREATER_OR_EQUAL = ">=",
  LESS_THAN = "<",
  LESS_OR_EQUAL = "<=",
  LIKE = "LIKE",
  IN = "IN",
  IS_NULL = "IS NULL",
  IS_NOT_NULL = "IS NOT NULL",
}

export enum FilterLogic {
  AND = "AND",
  OR = "OR",
}

export interface DataSource {
  id: number;
  datasourceCode: string;
  tenantId: string;
  name: string;
  dbType: DatabaseType | string;
  jdbcUrl: string;
  username: string;
  maxPoolSize: number;
  isReadOnly: boolean;
  status: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  columnSize?: number;
  nullable: boolean;
  isPrimaryKey: boolean;
  remarks?: string;
}

export interface TableInfo {
  tableName: string;
  tableType: string;
  remarks?: string;
  columns: ColumnInfo[];
}

export interface SchemaInfo {
  datasourceCode: string;
  databaseType: string;
  tables: TableInfo[];
}

export interface DynamicParamConfig {
  id: string;
  name: string;             // VD: fromDate, toDate, provinceCode
  label: string;            // VD: Từ ngày, Đến ngày, Tỉnh/Thành phố
  type: "Date" | "Dropdown" | "Text" | "Number";
  defaultValue: string;
  isRequired: boolean;
  options?: string[];       // Dành cho kiểu Dropdown
}

export interface StaticFilterRule {
  id: string;
  logicalOp: "AND" | "OR";
  tableName?: string;
  column: string;
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "LIKE" | "IS NULL" | "IS NOT NULL";
  value: string;
}

export interface SelectedColumnConfig {
  id: string;
  tableName: string;
  columnName: string;
  alias: string;
  aggregation: AggregationType;
  dataType: string;
  isFormula?: boolean;
  formulaExpression?: string;
}

export interface JoinConfig {
  id: string;
  joinType: JoinType;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface ReportVisualConfig {
  chartType: ChartType;
  chartTitle: string;
  xAxisKey: string;
  yAxisKey: string;
  showValueLabel: boolean;
  showGrid: boolean;
  colorPalette: "corporate" | "emerald" | "sunset" | string;
  numberFormat: "compact" | "full";
  currencyUnit: string;
}

export interface ReportTemplateMetadata {
  title: string;
  templateCode: string;
  description: string;
  category: string;
  defaultViewMode: "BOTH" | "CHART" | "TABLE";
}

export interface ReportTemplateConfig {
  metadata: ReportTemplateMetadata;
  mainTable: string;
  joins: JoinConfig[];
  selectedColumns: SelectedColumnConfig[];
  staticFilters: StaticFilterRule[];
  dynamicParams: DynamicParamConfig[];
  visualConfig: ReportVisualConfig;
}

export interface SelectedColumn {
  id: string;
  tableName: string;
  columnName: string;
  alias?: string;
  aggregation?: AggregationType;
  dataType?: string;
  isFormula?: boolean;
  formulaExpression?: string;
}

export interface JoinRelation {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  joinType: JoinType;
}

export interface FilterCondition {
  id: string;
  tableName: string;
  columnName: string;
  operator: FilterOperator | string;
  value: string;
  logic: FilterLogic;
}

export interface VisualGuiConfig {
  primaryTable: string;
  columns: SelectedColumn[];
  joins: JoinRelation[];
  filters: FilterCondition[];
  dynamicParams?: DynamicParamConfig[];
  metadata?: ReportTemplateMetadata;
  visualConfig?: ReportVisualConfig;
  groupBy: string[];
  orderBy: { column: string; direction: "ASC" | "DESC" }[];
  limit: number;
}

export interface ReportTemplate {
  id?: number;
  templateCode: string;
  tenantId?: string;
  datasourceCode: string;
  templateName: string;
  mode: QueryMode;
  status: TemplateStatus;
  isPublic?: boolean;
  isSystem?: boolean;
  configJson: string;
  transformJs?: string;
  accessCount?: number;
  lastAccessedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface QueryPreviewResponse {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
  executionTimeMs: number;
  generatedSql?: string;
}

export interface ExportTask {
  id: number;
  taskCode: string;
  tenantId: string;
  fileName: string;
  filePath: string;
  fileSizeBytes?: number;
  rowCount?: number;
  status: TaskStatus;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  downloadUrl?: string;
}

export enum ChartType {
  BAR = "BAR",
  LINE = "LINE",
  PIE = "PIE",
  KPI = "KPI",
  TABLE = "TABLE",
  DONUT = "DONUT",
  KPI_CARD = "KPI_CARD",
  PIVOT = "PIVOT",
}

export interface ColumnMetadataDto {
  columnName: string;
  dataType: string;
  label?: string;
  isNumeric?: boolean;
  isDate?: boolean;
  format?: "CURRENCY" | "NUMBER" | "DATE" | "PERCENT" | "TEXT";
}

export interface ReportVisualConfigDto {
  chartType: ChartType;
  xAxisColumn?: string;
  yAxisColumns?: string[];
  categoryColumn?: string;
  valueColumn?: string;
  kpiTitle?: string;
  kpiSubtitle?: string;
  kpiValueColumn?: string;
  kpiAggregation?: "SUM" | "COUNT" | "AVG" | "MAX" | "MIN";
  kpiFormat?: "CURRENCY" | "NUMBER" | "PERCENT";
  showLegend?: boolean;
  showGrid?: boolean;
  colorPalette?: string[];
  numberFormat?: "compact" | "full";
  currencyUnit?: string;
}

