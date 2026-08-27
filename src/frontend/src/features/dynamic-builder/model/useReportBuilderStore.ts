import { create } from "zustand";
import { defaultApiClient, ReportBuilderApiClient } from "../api/reportBuilderApi";
import {
  AggregationType,
  BUILDER_CONSTANTS,
  ChartType,
  DataSource,
  FilterCondition,
  JoinRelation,
  QueryMode,
  QueryPreviewResponse,
  ReportTemplate,
  ReportTemplateMetadata,
  ReportVisualConfig,
  SchemaInfo,
  SelectedColumn,
  TableInfo,
  TemplateStatus,
  ThemeMode,
  VisualGuiConfig,
} from "./types";


const initialGuiConfig: VisualGuiConfig = {
  primaryTable: "",
  columns: [],
  joins: [],
  filters: [],
  dynamicParams: [],
  metadata: {
    title: "",
    templateCode: "",
    description: "",
    category: "GENERAL",
    defaultViewMode: "BOTH",
  },
  visualConfig: {
    chartType: ChartType.BAR,
    chartTitle: "Biểu Đồ Trực Quan Báo Cáo",
    xAxisKey: "",
    yAxisKey: "",
    showValueLabel: true,
    showGrid: true,
    colorPalette: "corporate",
    numberFormat: "full",
    currencyUnit: "VNĐ",
  },
  groupBy: [],
  orderBy: [],
  limit: BUILDER_CONSTANTS.DEFAULT_PREVIEW_LIMIT,
};

interface ReportBuilderState {
  engineUrl: string;
  tenantId: string;
  authToken?: string;
  apiKey?: string;
  theme: "light" | "dark";
  apiClient: ReportBuilderApiClient;

  mode: QueryMode;
  datasources: DataSource[];
  activeDatasourceCode: string;
  schemaInfo: SchemaInfo | null;
  schemaCache: Record<string, SchemaInfo>;
  selectedTable: TableInfo | null;

  guiConfig: VisualGuiConfig;
  sqlQuery: string;
  queryParameters: Record<string, any>;
  transformJs: string;

  previewData: QueryPreviewResponse | null;
  isLoadingSchema: boolean;
  isLoadingPreview: boolean;
  isExporting: boolean;
  errorMessage: string | null;

  activeTemplate: ReportTemplate | null;

  // Actions
  initSession: (params: {
    engineUrl?: string;
    tenantId?: string;
    authToken?: string;
    apiKey?: string;
    theme?: "light" | "dark";
    defaultDatasourceCode?: string;
    allowedDatasources?: string[] | string;
    listDatasource?: string[] | string;
  }) => Promise<void>;
  setTheme: (theme: "light" | "dark") => void;
  setMode: (mode: QueryMode) => void;
  setActiveDatasource: (code: string) => Promise<void>;
  setSelectedTable: (table: TableInfo | null) => void;
  setSqlQuery: (sqlQuery: string) => void;
  setQueryParameter: (key: string, value: any) => void;
  setTransformJs: (transformJs: string) => void;
  clearPreview: () => void;

  // 1. Metadata Actions
  updateMetadata: (metadata: Partial<VisualGuiConfig["metadata"]>) => void;

  // 2. Visual GUI Actions
  setPrimaryTable: (tableName: string) => void;
  toggleColumnSelection: (tableName: string, columnName: string, dataType?: string) => void;
  addFormulaColumn: (alias: string, formulaExpression: string, dataType?: string) => void;
  updateColumnAlias: (id: string, alias: string) => void;
  updateColumnAggregation: (
    id: string,
    aggregation: SelectedColumn["aggregation"]
  ) => void;
  updateColumnFormula: (id: string, formulaExpression: string) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (startIndex: number, endIndex: number) => void;

  // 3. JOIN Actions
  addJoinRelation: (join: JoinRelation) => void;
  updateJoinRelation: (id: string, updates: Partial<JoinRelation>) => void;
  removeJoinRelation: (id: string) => void;

  // 4. Filter & Dynamic Params Actions
  addFilterCondition: (filter: FilterCondition) => void;
  updateFilterCondition: (id: string, updates: Partial<FilterCondition>) => void;
  removeFilterCondition: (filterId: string) => void;
  addDynamicParam: (param: {
    id: string;
    name: string;
    label: string;
    type: "Date" | "Dropdown" | "Text" | "Number";
    defaultValue: string;
    isRequired: boolean;
  }) => void;
  updateDynamicParam: (
    id: string,
    updates: Partial<{
      name: string;
      label: string;
      type: "Date" | "Dropdown" | "Text" | "Number";
      defaultValue: string;
      isRequired: boolean;
    }>
  ) => void;
  removeDynamicParam: (id: string) => void;

  // 5. Visual Config Actions
  updateVisualConfig: (config: Partial<NonNullable<VisualGuiConfig["visualConfig"]>>) => void;

  // Execution & Converters
  convertGuiToSql: () => string;
  runPreview: () => Promise<void>;
  saveCurrentTemplate: (name: string, code: string) => Promise<ReportTemplate>;
  loadTemplate: (template: ReportTemplate) => void;
}


export const useReportBuilderStore = create<ReportBuilderState>((set, get) => ({
  engineUrl: "",
  tenantId: BUILDER_CONSTANTS.DEFAULT_TENANT_ID,
  theme: ThemeMode.LIGHT,
  apiClient: defaultApiClient,

  mode: QueryMode.GUI,
  datasources: [],
  activeDatasourceCode: "",
  schemaInfo: null,
  schemaCache: {},
  selectedTable: null,

  guiConfig: initialGuiConfig,
  sqlQuery: "SELECT 1 AS status",
  queryParameters: {},
  transformJs: "// function transform(rows) { return rows; }",

  previewData: null,
  isLoadingSchema: false,
  isLoadingPreview: false,
  isExporting: false,
  errorMessage: null,

  activeTemplate: null,

  initSession: async ({
    engineUrl = "",
    tenantId = BUILDER_CONSTANTS.DEFAULT_TENANT_ID,
    authToken,
    apiKey,
    theme = ThemeMode.LIGHT,
    defaultDatasourceCode,
    allowedDatasources,
    listDatasource,
  }) => {
    const client = new ReportBuilderApiClient(
      engineUrl,
      tenantId,
      authToken,
      apiKey
    );
    set({ engineUrl, tenantId, authToken, apiKey, theme, apiClient: client });

    try {
      const filterDs = allowedDatasources || listDatasource;
      const dsList = await client.getDataSources(filterDs);
      set({ datasources: dsList });

      const currentActive = get().activeDatasourceCode;
      const isCurrentValid = dsList.some((ds) => ds.datasourceCode === currentActive);

      const targetDsCode =
        (isCurrentValid && currentActive) ||
        defaultDatasourceCode ||
        (dsList.length > 0 ? dsList[0].datasourceCode : "");

      if (targetDsCode && targetDsCode !== currentActive) {
        await get().setActiveDatasource(targetDsCode);
      } else if (targetDsCode && !get().schemaInfo) {
        await get().setActiveDatasource(targetDsCode);
      }
    } catch (err: any) {
      set({
        errorMessage: "Không thể kết nối đến Report Engine: " + err.message,
      });
    }
  },

  setTheme: (theme) => set({ theme }),
  setMode: (mode) => set({ mode }),

  setActiveDatasource: async (code: string) => {
    if (!code) return;
    const { schemaCache } = get();
    if (schemaCache[code]) {
      const cached = schemaCache[code];
      set({
        activeDatasourceCode: code,
        schemaInfo: cached,
        isLoadingSchema: false,
        selectedTable: cached.tables.length > 0 ? cached.tables[0] : null,
      });
      if (cached.tables.length > 0 && !get().guiConfig.primaryTable) {
        get().setPrimaryTable(cached.tables[0].tableName);
      }
      return;
    }

    set({
      activeDatasourceCode: code,
      isLoadingSchema: true,
      errorMessage: null,
    });
    try {
      const schema = await get().apiClient.getSchema(code);
      const firstTableName = schema.tables.length > 0 ? schema.tables[0].tableName : "";
      set((state) => ({
        schemaInfo: schema,
        schemaCache: { ...state.schemaCache, [code]: schema },
        isLoadingSchema: false,
        selectedTable: schema.tables.length > 0 ? schema.tables[0] : null,
        guiConfig: {
          primaryTable: firstTableName,
          columns: [],
          joins: [],
          filters: [],
          groupBy: [],
          orderBy: [],
          limit: 50,
        },
        previewData: null,
      }));
    } catch (err: any) {
      set({
        schemaInfo: null,
        isLoadingSchema: false,
        errorMessage: "Lỗi tải Schema: " + err.message,
      });
    }
  },

  setSelectedTable: (table) => set({ selectedTable: table }),
  setSqlQuery: (sqlQuery) => set({ sqlQuery }),
  setQueryParameter: (key, value) =>
    set((state) => ({
      queryParameters: { ...state.queryParameters, [key]: value },
    })),
  setTransformJs: (transformJs) => set({ transformJs }),
  clearPreview: () => set({ previewData: null }),

  updateMetadata: (metadataUpdates) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        metadata: {
          title: state.guiConfig.metadata?.title || "",
          templateCode: state.guiConfig.metadata?.templateCode || "",
          description: state.guiConfig.metadata?.description || "",
          category: state.guiConfig.metadata?.category || "GENERAL",
          defaultViewMode: state.guiConfig.metadata?.defaultViewMode || "BOTH",
          ...metadataUpdates,
        },
      },
    }));
  },


  setPrimaryTable: (tableName) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        primaryTable: tableName,
        columns: [],
      },
    }));
  },

  toggleColumnSelection: (tableName, columnName, dataType) => {
    set((state) => {
      const exists = state.guiConfig.columns.find(
        (c) => c.tableName === tableName && c.columnName === columnName
      );
      if (exists) {
        return {
          guiConfig: {
            ...state.guiConfig,
            columns: state.guiConfig.columns.filter((c) => c.id !== exists.id),
          },
        };
      } else {
        const newCol: SelectedColumn = {
          id: `${tableName}_${columnName}_${Date.now()}`,
          tableName,
          columnName,
          alias: columnName,
          dataType: dataType || "VARCHAR",
          aggregation: AggregationType.NONE,
        };
        return {
          guiConfig: {
            ...state.guiConfig,
            columns: [...state.guiConfig.columns, newCol],
          },
        };
      }
    });
  },

  addFormulaColumn: (alias, formulaExpression, dataType = "NUMBER") => {
    set((state) => {
      const newCol: SelectedColumn = {
        id: `formula_${Date.now()}`,
        tableName: state.guiConfig.primaryTable || "calc",
        columnName: alias,
        alias,
        dataType,
        isFormula: true,
        formulaExpression,
        aggregation: AggregationType.NONE,
      };
      return {
        guiConfig: {
          ...state.guiConfig,
          columns: [...state.guiConfig.columns, newCol],
        },
      };
    });
  },

  updateColumnAlias: (id, alias) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        columns: state.guiConfig.columns.map((c) =>
          c.id === id ? { ...c, alias } : c
        ),
      },
    }));
  },

  updateColumnAggregation: (id, aggregation) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        columns: state.guiConfig.columns.map((c) =>
          c.id === id ? { ...c, aggregation } : c
        ),
      },
    }));
  },

  updateColumnFormula: (id, formulaExpression) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        columns: state.guiConfig.columns.map((c) =>
          c.id === id ? { ...c, formulaExpression } : c
        ),
      },
    }));
  },

  removeColumn: (id) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        columns: state.guiConfig.columns.filter((c) => c.id !== id),
      },
    }));
  },

  reorderColumns: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.guiConfig.columns);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return {
        guiConfig: {
          ...state.guiConfig,
          columns: result,
        },
      };
    });
  },

  addJoinRelation: (join) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        joins: [...state.guiConfig.joins, join],
      },
    }));
  },

  updateJoinRelation: (id, updates) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        joins: state.guiConfig.joins.map((j) =>
          j.id === id ? { ...j, ...updates } : j
        ),
      },
    }));
  },

  removeJoinRelation: (id) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        joins: state.guiConfig.joins.filter((j) => j.id !== id),
      },
    }));
  },

  addFilterCondition: (filter) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        filters: [...state.guiConfig.filters, filter],
      },
    }));
  },

  updateFilterCondition: (id, updates) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        filters: state.guiConfig.filters.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      },
    }));
  },

  removeFilterCondition: (filterId: string) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        filters: state.guiConfig.filters.filter((f) => f.id !== filterId),
      },
    }));
  },

  addDynamicParam: (param) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        dynamicParams: [...(state.guiConfig.dynamicParams || []), param],
      },
    }));
  },

  updateDynamicParam: (id, updates) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        dynamicParams: (state.guiConfig.dynamicParams || []).map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    }));
  },

  removeDynamicParam: (id) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        dynamicParams: (state.guiConfig.dynamicParams || []).filter((p) => p.id !== id),
      },
    }));
  },

  updateVisualConfig: (configUpdates) => {
    set((state) => ({
      guiConfig: {
        ...state.guiConfig,
        visualConfig: {
          ...(state.guiConfig.visualConfig || {
            chartType: ChartType.BAR,
            chartTitle: "Biểu Đồ Trực Quan Báo Cáo",
            xAxisKey: "",
            yAxisKey: "",
            showValueLabel: true,
            showGrid: true,
            colorPalette: "corporate",
            numberFormat: "full",
            currencyUnit: "VNĐ",
          }),
          ...configUpdates,
        },
      },
    }));
  },

  convertGuiToSql: () => {
    const { guiConfig } = get();
    if (!guiConfig.primaryTable) {
      return "SELECT 'Vui lòng chọn bảng gốc (Primary Table)' AS notice";
    }

    let selectExprs = "*";
    if (guiConfig.columns.length > 0) {
      selectExprs = guiConfig.columns
        .map((col) => {
          let expr = "";
          if (col.isFormula && col.formulaExpression) {
            expr = col.formulaExpression;
          } else {
            const colFull = `${col.tableName}.${col.columnName}`;
            expr = colFull;
            if (col.aggregation && col.aggregation !== AggregationType.NONE) {
              expr = `${col.aggregation}(${colFull})`;
            }
          }
          if (col.alias && col.alias !== col.columnName) {
            const cleanAlias = col.alias.trim().replace(/"/g, "");
            expr += ` AS "${cleanAlias}"`;
          }
          return expr;
        })
        .join(", ");
    }

    let sql = `SELECT ${selectExprs}\nFROM ${guiConfig.primaryTable}`;

    const explicitJoinedTables = new Set(guiConfig.joins.map((j) => j.targetTable));

    if (guiConfig.joins && guiConfig.joins.length > 0) {
      guiConfig.joins.forEach((j) => {
        sql += `\n${j.joinType || "INNER"} JOIN ${j.targetTable} ON ${j.sourceTable}.${j.sourceColumn} = ${j.targetTable}.${j.targetColumn}`;
      });
    }

    // Tự động thêm JOIN cho các bảng có cột được chọn nhưng chưa nằm trong explicit joins
    const otherTablesWithCols = Array.from(
      new Set(
        guiConfig.columns
          .map((c) => c.tableName)
          .filter((t) => t && t !== guiConfig.primaryTable && !explicitJoinedTables.has(t))
      )
    );

    const tables = get().schemaInfo?.tables || [];
    const primaryTableObj = tables.find((t) => t.tableName === guiConfig.primaryTable);

    otherTablesWithCols.forEach((otherTableName) => {
      const otherTableObj = tables.find((t) => t.tableName === otherTableName);
      if (primaryTableObj && otherTableObj) {
        const commonCol = primaryTableObj.columns.find((pc) =>
          otherTableObj.columns.some((oc) => oc.columnName === pc.columnName)
        );
        if (commonCol) {
          sql += `\nLEFT JOIN ${otherTableName} ON ${guiConfig.primaryTable}.${commonCol.columnName} = ${otherTableName}.${commonCol.columnName}`;
        } else {
          const fkInPrimary = primaryTableObj.columns.find(
            (c) => c.columnName === `${otherTableName}_id` || c.columnName === "id"
          );
          const pkInOther = otherTableObj.columns.find(
            (c) => c.columnName === `${guiConfig.primaryTable}_id` || c.columnName === "id"
          );
          if (fkInPrimary && pkInOther) {
            sql += `\nLEFT JOIN ${otherTableName} ON ${guiConfig.primaryTable}.${fkInPrimary.columnName} = ${otherTableName}.${pkInOther.columnName}`;
          }
        }
      }
    });

    const whereClauses: string[] = [];

    // Static Filters
    if (guiConfig.filters && guiConfig.filters.length > 0) {
      guiConfig.filters.forEach((f, idx) => {
        const val =
          f.operator === "IS NULL" || f.operator === "IS NOT NULL"
            ? ""
            : f.value.startsWith("{{") || f.value.startsWith(":")
            ? f.value
            : `'${f.value}'`;
        const clause = `${f.tableName}.${f.columnName} ${f.operator} ${val}`.trim();
        whereClauses.push(idx === 0 ? clause : `${f.logic} ${clause}`);
      });
    }

    // Dynamic Parameters (:param IS NULL OR col = :param)
    if (guiConfig.dynamicParams && guiConfig.dynamicParams.length > 0) {
      guiConfig.dynamicParams.forEach((dp) => {
        const paramVar = `:${dp.name}`;
        // Tìm cột liên kết nếu có, hoặc tạo mệnh đề parameterized
        const targetCol = `${guiConfig.primaryTable}.${dp.name}`;
        const paramClause = `(${paramVar} IS NULL OR ${targetCol} = ${paramVar})`;
        if (whereClauses.length === 0) {
          whereClauses.push(paramClause);
        } else {
          whereClauses.push(`AND ${paramClause}`);
        }
      });
    }

    if (whereClauses.length > 0) {
      sql += `\nWHERE ${whereClauses.join(" ")}`;
    }

    const hasAgg = guiConfig.columns.some(
      (c) => !c.isFormula && c.aggregation && c.aggregation !== AggregationType.NONE
    );
    const nonAggCols = guiConfig.columns.filter(
      (c) => !c.isFormula && (!c.aggregation || c.aggregation === AggregationType.NONE)
    );
    if (hasAgg && nonAggCols.length > 0) {
      const groupExprs = nonAggCols.map((c) => `${c.tableName}.${c.columnName}`);
      sql += `\nGROUP BY ${groupExprs.join(", ")}`;
    }

    set({ sqlQuery: sql });
    return sql;
  },

  runPreview: async () => {
    const state = get();
    set({ isLoadingPreview: true, errorMessage: null });

    let querySql = state.sqlQuery;
    let configJson = "";

    if (state.mode === QueryMode.GUI) {
      querySql = state.convertGuiToSql();
      configJson = JSON.stringify(state.guiConfig);
    }

    try {
      const res = await state.apiClient.previewQuery({
        datasourceCode: state.activeDatasourceCode,
        mode: state.mode,
        sql: querySql,
        configJson,
        params: state.queryParameters,
        limit: 50,
      });
      set({ previewData: res, isLoadingPreview: false });
    } catch (err: any) {
      set({
        previewData: null,
        isLoadingPreview: false,
        errorMessage:
          err.response?.data?.message || err.message || "Lỗi thực thi truy vấn",
      });
    }
  },

  saveCurrentTemplate: async (templateName: string, templateCode: string) => {
    const state = get();
    const isGui = state.mode === QueryMode.GUI;
    const configJson = isGui
      ? JSON.stringify(state.guiConfig)
      : state.sqlQuery;

    const tpl: ReportTemplate = {
      id: state.activeTemplate?.id,
      templateCode,
      templateName,
      datasourceCode: state.activeDatasourceCode,
      mode: state.mode,
      status: TemplateStatus.ACTIVE,
      configJson,
      transformJs: state.transformJs,
    };

    const saved = await state.apiClient.saveTemplate(tpl);
    set({ activeTemplate: saved });
    return saved;
  },

  loadTemplate: (template: ReportTemplate) => {
    set({
      activeTemplate: template,
      activeDatasourceCode: template.datasourceCode,
      mode: template.mode,
      transformJs: template.transformJs || "",
      errorMessage: null,
    });

    if (template.mode === QueryMode.GUI) {
      try {
        const parsed = JSON.parse(template.configJson);
        set({ guiConfig: parsed });
      } catch (e) {
        console.error("Lỗi parse configJson", e);
      }
    } else {
      set({ sqlQuery: template.configJson });
    }
  },
}));
