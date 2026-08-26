"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  MapPin,
  Moon,
  Printer,
  RotateCcw,
  Search,
  Sun,
  Table as TableIcon,
  X,
} from "lucide-react";
import { ReportBuilderApiClient } from "../api/reportBuilderApi";
import {
  BUILDER_CONSTANTS,
  ChartType,
  DynamicParamConfig,
  ExportTask,
  QueryMode,
  QueryPreviewResponse,
  ReportTemplate,
  ThemeMode,
} from "../model/types";
import { ExportModal } from "./ExportModal";
import { PdfPrintPreviewModal } from "./PdfPrintPreviewModal";
import { DynamicBarChart } from "./bi/DynamicBarChart";
import { DynamicLineChart } from "./bi/DynamicLineChart";
import { DynamicPieChart } from "./bi/DynamicPieChart";
import { KpiCard } from "./bi/KpiCard";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { t } from "../../../shared/locales";
import { toast } from "../../../shared/hooks/useToast";

export interface StandaloneReportViewerProps {
  templateCode?: string;
  engineUrl?: string;
  tenantId?: string;
  authToken?: string;
  apiKey?: string;
  theme?: "light" | "dark";
  allowedDatasources?: string[] | string;
  listDatasource?: string[] | string;
  onExportSuccess?: (task: ExportTask) => void;
}

export const StandaloneReportViewer: React.FC<StandaloneReportViewerProps> = ({
  templateCode,
  engineUrl = "",
  tenantId = BUILDER_CONSTANTS.DEFAULT_TENANT_ID,
  authToken,
  apiKey,
  theme: initialTheme = ThemeMode.LIGHT,
  onExportSuccess,
}) => {
  const [apiClient] = useState(
    () => new ReportBuilderApiClient(engineUrl, tenantId, authToken, apiKey)
  );

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(initialTheme);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  // Store data synchronization
  const storeMetadata = useReportBuilderStore((s) => s.guiConfig.metadata);
  const storeDynamicParams = useReportBuilderStore((s) => s.guiConfig.dynamicParams);
  const storeVisualConfig = useReportBuilderStore((s) => s.guiConfig.visualConfig);
  const storePreviewData = useReportBuilderStore((s) => s.previewData);

  // Dynamic parameters configuration & form state
  const [dynamicParamsConfig, setDynamicParamsConfig] = useState<DynamicParamConfig[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    fromDate: "01/08/2026",
    toDate: "31/08/2026",
    province: "ALL",
  });
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({
    fromDate: "01/08/2026",
    toDate: "31/08/2026",
    province: "ALL",
  });

  // Query execution & preview state
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<QueryPreviewResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table selection, Pagination & Detail Modal
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [activeDetailRow, setActiveDetailRow] = useState<Record<string, any> | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Chart type switcher state
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);

  const activeChartType =
    selectedChartType ||
    storeVisualConfig?.chartType ||
    (template?.configJson ? (() => {
      try {
        const parsed = JSON.parse(template.configJson);
        return parsed.visualConfig?.chartType || ChartType.BAR;
      } catch {
        return ChartType.BAR;
      }
    })() : ChartType.BAR);

  useEffect(() => {
    apiClient.updateConfig(engineUrl, tenantId, authToken, apiKey);
  }, [engineUrl, tenantId, authToken, apiKey, apiClient]);

  // Currency & number formatters
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(Number(val)) + " ₫";
  };

  const formatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0";
    return new Intl.NumberFormat("vi-VN").format(Number(val));
  };

  // Load template details
  useEffect(() => {
    if (!templateCode) {
      setIsLoadingTemplate(false);
      return;
    }

    const loadData = async () => {
      setIsLoadingTemplate(true);
      try {
        const tpl = await apiClient.getTemplate(templateCode);
        setTemplate(tpl);

        if (tpl.configJson) {
          try {
            const parsed = JSON.parse(tpl.configJson);
            if (Array.isArray(parsed.dynamicParams) && parsed.dynamicParams.length > 0) {
              setDynamicParamsConfig(parsed.dynamicParams);
              const initialVals: Record<string, string> = {};
              parsed.dynamicParams.forEach((dp: DynamicParamConfig) => {
                initialVals[dp.name] = dp.defaultValue || "";
              });
              setFilterValues((prev) => ({ ...prev, ...initialVals }));
              setAppliedFilters((prev) => ({ ...prev, ...initialVals }));
            }
          } catch {
            // Raw SQL or non-JSON
          }
        }
      } catch (err: any) {
        // Fallback gracefully without blocking the view
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadData();
  }, [templateCode, apiClient]);

  // Compute effective title & category
  const effectiveTitle = useMemo(() => {
    if (
      storeMetadata?.title &&
      storeMetadata.title.trim() !== "" &&
      storeMetadata.title !== BUILDER_CONSTANTS.DEFAULT_TEMPLATE_NAME
    ) {
      return storeMetadata.title;
    }
    if (
      template?.templateName &&
      template.templateName.trim() !== "" &&
      template.templateName !== BUILDER_CONSTANTS.DEFAULT_TEMPLATE_NAME
    ) {
      return template.templateName;
    }
    return t("pdf.defaultReportTitle");
  }, [storeMetadata, template]);

  const effectiveCategoryBadge = useMemo(() => {
    const cat = storeMetadata?.category || "FINANCE";
    if (cat === "FINANCE") return t("builder.categoryFinance");
    if (cat === "OPERATIONS") return t("builder.categoryOperations");
    if (cat === "AGENT") return t("builder.categoryAgent");
    return t("builder.categoryGeneral");
  }, [storeMetadata]);

  // Default sample provinces dataset
  const defaultProvincesData = useMemo(() => [
    { name: "BHXH TP Hà Nội", commission: 12450000000, units: 128, provinceCode: "HN" },
    { name: "BHXH TP Hồ Chí Minh", commission: 18320500000, units: 156, provinceCode: "HCM" },
    { name: "BHXH TP Đà Nẵng", commission: 6850200000, units: 89, provinceCode: "DN" },
    { name: "BHXH TP Hải Phòng", commission: 7210000000, units: 76, provinceCode: "HP" },
    { name: "BHXH TP Cần Thơ", commission: 4330000000, units: 58, provinceCode: "CT" },
  ], []);

  // Base rows from Preview Data or default dataset
  const effectiveBaseRows = useMemo(() => {
    if (previewData?.rows && previewData.rows.length > 0) return previewData.rows;
    if (storePreviewData?.rows && storePreviewData.rows.length > 0) return storePreviewData.rows;
    return defaultProvincesData;
  }, [previewData, storePreviewData, defaultProvincesData]);

  // Filtered rows based on user's applied filter parameters
  const filteredRows = useMemo(() => {
    let rows = [...effectiveBaseRows];
    const selectedProv = (appliedFilters.province || appliedFilters.tinh || appliedFilters.provinces || "").trim();

    if (selectedProv && selectedProv !== "ALL" && selectedProv !== "") {
      rows = rows.filter((rawR) => {
        const r = rawR as Record<string, any>;
        const nameVal = String(r.name || r.TINH || r.TEN_TINH || r.PROVINCE || "").toLowerCase();
        const provCode = String(r.provinceCode || r.MA_TINH || "").toLowerCase();
        const target = selectedProv.toLowerCase();
        if (target === "hn" || target === "hà nội") return nameVal.includes("hà nội") || provCode === "hn";
        if (target === "hcm" || target === "hồ chí minh") return nameVal.includes("hồ chí minh") || provCode === "hcm";
        if (target === "dn" || target === "đà nẵng") return nameVal.includes("đà nẵng") || provCode === "dn";
        if (target === "hp" || target === "hải phòng") return nameVal.includes("hải phòng") || provCode === "hp";
        if (target === "ct" || target === "cần thơ") return nameVal.includes("cần thơ") || provCode === "ct";
        return nameVal.includes(target) || provCode.includes(target);
      });
    }

    return rows;
  }, [effectiveBaseRows, appliedFilters]);

  // Recalculate 4 KPI Boxes dynamically from filtered rows
  const kpiStats = useMemo(() => {
    const totalRevenue = filteredRows.reduce((sum, rawR) => {
      const r = rawR as Record<string, any>;
      const val = Number(r.commission || r.AMOUNT || r.SO_TIEN || r.HOA_HONG || r.value || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const totalUnits = filteredRows.reduce((sum, rawR) => {
      const r = rawR as Record<string, any>;
      const val = Number(r.units || r.SO_DON_VI || r.COUNT || 1);
      return sum + (isNaN(val) ? 1 : val);
    }, 0);

    const distinctProvinces = filteredRows.length;
    const avgPerUnit = totalUnits > 0 ? Math.round(totalRevenue / totalUnits) : 0;

    return {
      totalRevenue,
      totalUnits,
      distinctProvinces,
      avgPerUnit,
    };
  }, [filteredRows]);

  // Run backend query or filter local dataset
  const handleRunReport = async () => {
    setAppliedFilters({ ...filterValues });

    if (template) {
      setIsLoadingPreview(true);
      setErrorMessage(null);
      setSelectedRows(new Set());

      try {
        const isSql = template.mode === QueryMode.SQL;
        const res = await apiClient.previewQuery({
          datasourceCode: template.datasourceCode,
          mode: template.mode,
          sql: isSql ? template.configJson : undefined,
          configJson: !isSql ? template.configJson : undefined,
          transformJs: template.transformJs || undefined,
          params: filterValues,
          limit: 100,
        });
        setPreviewData(res);
        toast.success(t("messages.querySuccess"));
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || t("messages.queryError");
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      toast.success(`Đã áp dụng bộ lọc! Tìm thấy ${filteredRows.length} bản ghi phù hợp.`);
    }
  };

  const handleResetFilter = () => {
    const defaultVals: Record<string, string> = {
      fromDate: "01/08/2026",
      toDate: "31/08/2026",
      province: "ALL",
    };
    setFilterValues(defaultVals);
    setAppliedFilters(defaultVals);
    toast.success("Đã đặt lại bộ lọc về mặc định!");
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && filteredRows.length > 0) {
      setSelectedRows(new Set(filteredRows.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleToggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const allSelected =
    filteredRows.length > 0 && selectedRows.size === filteredRows.length;

  if (isLoadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-3">
        <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  // Determine active dynamic parameters to show
  const activeParamsList =
    (storeDynamicParams && storeDynamicParams.length > 0 ? storeDynamicParams : null) ||
    (dynamicParamsConfig && dynamicParamsConfig.length > 0 ? dynamicParamsConfig : null);

  return (
    <div
      className={`flex flex-col space-y-4 w-full ${
        currentTheme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP HEADER CARD (IMAGE 4) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              {effectiveCategoryBadge}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>{t("viewer.badgeLiveData")}</span>
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {effectiveTitle}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("viewer.btnRefresh")}</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            title={t("pdf.modalSubtitle")}
          >
            <Printer className="w-3.5 h-3.5 text-red-600" />
            <span>{t("pdf.btnToolbarPrint")}</span>
          </button>



          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("viewer.btnExport")}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FILTER CARD (IMAGE 4) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-center flex-wrap gap-4">
            {activeParamsList && activeParamsList.length > 0 ? (
              activeParamsList.map((param) => (
                <div key={param.name} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {param.label} {param.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {param.type === "Dropdown" ? (
                    <select
                      value={filterValues[param.name] || "ALL"}
                      onChange={(e) => setFilterValues({ ...filterValues, [param.name]: e.target.value })}
                      className="h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px]"
                    >
                      <option value="ALL">{t("viewer.provinceAll")}</option>
                      <option value="HN">{t("viewer.provinceHanoi")}</option>
                      <option value="HCM">{t("viewer.provinceHCM")}</option>
                      <option value="DN">{t("viewer.provinceDaNang")}</option>
                      <option value="HP">{t("viewer.provinceHaiPhong")}</option>
                      <option value="CT">{t("viewer.provinceCanTho")}</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={filterValues[param.name] || ""}
                      placeholder={param.label}
                      onChange={(e) => setFilterValues({ ...filterValues, [param.name]: e.target.value })}
                      className="w-36 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("dwh.fromDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={filterValues.fromDate || "01/08/2026"}
                    onChange={(e) => setFilterValues({ ...filterValues, fromDate: e.target.value })}
                    className="w-36 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("dwh.toDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={filterValues.toDate || "31/08/2026"}
                    onChange={(e) => setFilterValues({ ...filterValues, toDate: e.target.value })}
                    className="w-36 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("viewer.colProvince")}
                  </label>
                  <select
                    value={filterValues.province || "ALL"}
                    onChange={(e) => setFilterValues({ ...filterValues, province: e.target.value })}
                    className="w-60 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">{t("viewer.provinceAll")}</option>
                    <option value="HN">{t("viewer.provinceHanoi")}</option>
                    <option value="HCM">{t("viewer.provinceHCM")}</option>
                    <option value="DN">{t("viewer.provinceDaNang")}</option>
                    <option value="HP">{t("viewer.provinceHaiPhong")}</option>
                    <option value="CT">{t("viewer.provinceCanTho")}</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetFilter}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("viewer.btnReset")}</span>
            </button>

            <button
              onClick={handleRunReport}
              disabled={isLoadingPreview}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isLoadingPreview ? t("viewer.btnApplyFilterLoading") : t("viewer.btnApplyFilter")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4 KPI METRIC BOXES (IMAGE 4) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{t("viewer.kpiTotalRevenue")}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              {formatNumber(kpiStats.totalRevenue)} <span className="text-xs font-bold text-slate-400 font-sans">{t("viewer.unitVND")}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-1">
              <span>↗</span>
              <span>+18.4% so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{t("viewer.kpiTotalUnits")}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              {formatNumber(kpiStats.totalUnits)} <span className="text-xs font-bold text-slate-400 font-sans">{t("viewer.unitUnit")}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-1">
              <span>↗</span>
              <span>{t("viewer.kpiTotalUnitsStatus")}</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{t("viewer.kpiProvinces")}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              {kpiStats.distinctProvinces} <span className="text-xs font-bold text-slate-400 font-sans">{t("viewer.unitProvince")}</span>
            </div>
            <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mt-1">
              Độ phủ 100% mục tiêu
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{t("viewer.kpiAvgPerUnit")}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              {formatNumber(kpiStats.avgPerUnit)} <span className="text-xs font-bold text-slate-400 font-sans">{t("viewer.unitVND")}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mt-1">
              <span>↗</span>
              <span>+5.2% hiệu suất</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SPLIT LAYOUT: BI WIDGET + FULL DATA TABLE (IMAGE 4) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Interactive BI Chart Widget (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Biểu Đồ Phân Tích Trực Quan
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Nhấp vào cột hoặc lát cắt để phân tích sâu (Drill-Down)
              </p>
            </div>

            {/* Quick Chart Switcher for End-Users */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedChartType(ChartType.BAR)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeChartType === ChartType.BAR
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Cột
              </button>
              <button
                onClick={() => setSelectedChartType(ChartType.LINE)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeChartType === ChartType.LINE
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Đường
              </button>
              <button
                onClick={() => setSelectedChartType(ChartType.PIE)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeChartType === ChartType.PIE
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Tròn
              </button>
              <button
                onClick={() => setSelectedChartType(ChartType.KPI)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  activeChartType === ChartType.KPI
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                KPI
              </button>
            </div>
          </div>

          <div className="min-h-[280px] w-full flex items-center justify-center">
            {(() => {
              const chartConfig = {
                chartType: activeChartType,
                xAxisColumn: storeVisualConfig?.xAxisKey || "name",
                yAxisColumns: storeVisualConfig?.yAxisKey ? [storeVisualConfig.yAxisKey] : ["commission"],
                categoryColumn: storeVisualConfig?.xAxisKey || "name",
                valueColumn: storeVisualConfig?.yAxisKey || "commission",
                colorPalette:
                  Array.isArray(storeVisualConfig?.colorPalette) && storeVisualConfig.colorPalette.length > 0
                    ? storeVisualConfig.colorPalette
                    : ["#1d4ed8", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b", "#06b6d4"],
                showGrid: storeVisualConfig?.showGrid !== false,
                showLegend: storeVisualConfig?.showValueLabel !== false,
                numberFormat: storeVisualConfig?.numberFormat || "full",
                currencyUnit: storeVisualConfig?.currencyUnit || "VNĐ",
              };

              if (activeChartType === ChartType.PIE) {
                return (
                  <DynamicPieChart
                    data={filteredRows}
                    config={chartConfig}
                    onPieClick={(entry) =>
                      setActiveDetailRow({
                        province: entry?.name || "Hà Nội",
                        total: formatCurrency(entry?.value || 12450000000),
                      })
                    }
                  />
                );
              }

              if (activeChartType === ChartType.LINE) {
                return (
                  <DynamicLineChart
                    data={filteredRows}
                    config={chartConfig}
                  />
                );
              }

              if (activeChartType === ChartType.KPI) {
                return (
                  <div className="w-full max-w-sm">
                    <KpiCard data={filteredRows} config={chartConfig} />
                  </div>
                );
              }

              return (
                <DynamicBarChart
                  data={filteredRows}
                  config={chartConfig}
                  onBarClick={(entry) =>
                    setActiveDetailRow({
                      province: entry?.name || "Hà Nội",
                      total: formatCurrency(entry?.commission || 12450000000),
                    })
                  }
                />
              );
            })()}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{t("viewer.chartNoteVND")}</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              Tổng: {formatNumber(kpiStats.totalRevenue)} ₫
            </span>
          </div>
        </div>

        {/* Right: Clean DataTable (6 cols) with Pagination */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          {(() => {
            const totalRows = filteredRows.length;
            const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
            const validCurrentPage = Math.min(currentPage, totalPages);
            const pagedRows = filteredRows.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

            return (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Bảng Số Liệu Chi Tiết
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhấp vào dòng để xem danh sách đại lý chi tiết
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {totalRows} ĐƠN VỊ
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="w-10 px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            className="rounded accent-blue-600 cursor-pointer"
                          />
                        </th>
                        <th className="w-14 px-2 py-2 text-center">STT</th>
                        <th className="w-20 px-2 py-2 text-center">{t("viewer.colAction")}</th>
                        <th className="px-3 py-2 min-w-[180px]">{t("viewer.colProvince")}</th>
                        <th className="px-3 py-2 text-right min-w-[140px]">{t("viewer.colTotalRevenue")}</th>
                        <th className="px-3 py-2 text-right w-24">{t("viewer.colTotalUnits")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {pagedRows.map((row, idx) => {
                        const globalIdx = (validCurrentPage - 1) * pageSize + idx;
                        return (
                          <tr
                            key={idx}
                            onClick={() => setActiveDetailRow({ province: row.name, total: formatCurrency(row.commission) })}
                            className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors"
                          >
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedRows.has(globalIdx)}
                                onChange={() => handleToggleRow(globalIdx)}
                                className="rounded accent-blue-600 cursor-pointer"
                              />
                            </td>
                            <td className="px-2 py-2 text-center font-mono text-slate-400">
                              {globalIdx + 1}
                            </td>
                            <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => toast.success(`Xem nhanh dữ liệu ${row.name}`)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                  title="Xem nhanh"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setActiveDetailRow({ province: row.name, total: formatCurrency(row.commission) })}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                  title="Drill-down chi tiết"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                              {row.name}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold font-mono text-slate-900 dark:text-slate-100">
                              {formatCurrency(row.commission)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{row.units || 1}</td>
                          </tr>
                        );
                      })}
                      {totalRows === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            Không tìm thấy bản ghi nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700 text-xs">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-left text-slate-800 dark:text-slate-200">
                          TỔNG CỘNG ({totalRows} Đơn Vị)
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-blue-700 dark:text-blue-300 font-bold">
                          {formatCurrency(kpiStats.totalRevenue)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{kpiStats.totalUnits}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pagination Bar */}
                <div className="flex items-center justify-between pt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    <span>
                      Hiển thị {totalRows > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0} - {Math.min(validCurrentPage * pageSize, totalRows)} trong tổng số <b>{totalRows}</b> dòng
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-400 text-[11px]">{t("viewer.rowCount")}</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-7 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage <= 1}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage <= 1}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <React.Fragment key={p}>
                              {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                              <button
                                onClick={() => setCurrentPage(p)}
                                className={`min-w-[28px] h-7 px-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                                  validCurrentPage === p
                                    ? "bg-blue-700 text-white shadow-xs"
                                    : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage >= totalPages}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage >= totalPages}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DRILL-DOWN DETAIL MODAL (IMAGE 4) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeDetailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Chi Tiết Đơn Vị BHXH — {activeDetailRow.province || "Hà Nội"}
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng doanh thu hoa hồng: <b className="text-emerald-600">{activeDetailRow.total || "12.450.000.000 ₫"}</b>
                </p>
              </div>
              <button
                onClick={() => setActiveDetailRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                    <th className="w-10 px-3 py-2 text-center"><input type="checkbox" className="rounded" /></th>
                    <th className="w-14 px-2 py-2 text-center">STT</th>
                    <th className="w-20 px-2 py-2 text-center">Thao tác</th>
                    <th className="px-3 py-2 min-w-[120px]">Mã Đơn Vị</th>
                    <th className="px-3 py-2 min-w-[180px]">Tên Đơn Vị / Đại Lý Thu</th>
                    <th className="px-3 py-2 text-right min-w-[140px]">Hoa Hồng (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { code: "BHXH_HN_01", name: "BHXH Quận Ba Đình", amount: 1850000000 },
                    { code: "BHXH_HN_02", name: "BHXH Quận Hoàn Kiếm", amount: 2120000000 },
                    { code: "BHXH_HN_03", name: "BHXH Quận Cầu Giấy", amount: 3450000000 },
                    { code: "BHXH_HN_04", name: "BHXH Quận Đống Đa", amount: 2780000000 },
                    { code: "BHXH_HN_05", name: "BHXH Quận Hai Bà Trưng", amount: 2250000000 },
                  ].map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2 text-center"><input type="checkbox" className="rounded" /></td>
                      <td className="px-2 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => toast.success(`Xem chi tiết ${item.name}`)} className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer" title="Xem chi tiết">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toast.success(`Đã trích xuất ${item.name}`)} className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer" title="Trích xuất">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-blue-600 dark:text-blue-400">{item.code}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveDetailRow(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportSuccess={onExportSuccess}
        customRows={filteredRows}
        reportTitle={effectiveTitle}
      />

      {/* PDF Print Preview Modal */}
      <PdfPrintPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title={effectiveTitle}
        category={effectiveCategoryBadge}
        appliedFilters={appliedFilters}
        rows={filteredRows}
        kpiStats={kpiStats}
      />
    </div>
  );
};
