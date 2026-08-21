"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Layers,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { ReportBuilderApiClient } from "../api/reportBuilderApi";
import {
  BUILDER_CONSTANTS,
  ExportFormat,
  ExportTask,
  QueryMode,
  QueryPreviewResponse,
  ReportTemplate,
  ThemeMode,
} from "../model/types";
import { ExportModal } from "./ExportModal";
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
  allowedDatasources,
  listDatasource,
  onExportSuccess,
}) => {
  const [apiClient] = useState(
    () => new ReportBuilderApiClient(engineUrl, tenantId, authToken, apiKey)
  );

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(initialTheme);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  // Dynamic parameters form state
  const [extractedParams, setExtractedParams] = useState<string[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Query execution & preview state
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<QueryPreviewResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table selection & Detail Modal
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [activeDetailRow, setActiveDetailRow] = useState<Record<string, any> | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    apiClient.updateConfig(engineUrl, tenantId, authToken, apiKey);
  }, [engineUrl, tenantId, authToken, apiKey, apiClient]);

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

        // Extract params from SQL if mode is SQL
        if (tpl.mode === QueryMode.SQL && tpl.configJson) {
          const paramRegex = /\{\{params\.([a-zA-Z0-9_]+)\}\}/g;
          const matches = new Set<string>();
          let match;
          while ((match = paramRegex.exec(tpl.configJson)) !== null) {
            matches.add(match[1]);
          }
          setExtractedParams(Array.from(matches));
        } else if (tpl.mode === QueryMode.GUI && tpl.configJson) {
          try {
            const parsed = JSON.parse(tpl.configJson);
            const filters: any[] = parsed.filters || [];
            const paramsInFilters = new Set<string>();
            for (const f of filters) {
              const match = /\{\{params\.([a-zA-Z0-9_]+)\}\}/.exec(f.value || "");
              if (match) paramsInFilters.add(match[1]);
            }
            setExtractedParams(Array.from(paramsInFilters));
          } catch (e) {
            console.error("Error parsing GUI filters", e);
          }
        }
      } catch (err: any) {
        toast.error(t("messages.queryError") + ": " + (err.message || err));
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadData();
  }, [templateCode, apiClient]);

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleRunReport = async () => {
    if (!template) return;
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
        params: paramValues,
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
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && previewData?.rows) {
      setSelectedRows(new Set(previewData.rows.map((_, i) => i)));
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
    previewData?.rows &&
    previewData.rows.length > 0 &&
    selectedRows.size === previewData.rows.length;

  if (isLoadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-3">
        <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-3 p-8 text-center">
        <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700" />
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
          {t("common.noData")}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Mẫu báo cáo không tồn tại hoặc bạn không có quyền truy cập trên Tenant ({tenantId}).
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden ${
        currentTheme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Header Bar */}
      <header className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                {template.templateName}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                {template.templateCode}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>{template.datasourceCode}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Tenant: {tenantId}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentTheme(currentTheme === "dark" ? "light" : "dark")}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Theme Switcher"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("export.title")}</span>
          </button>
        </div>
      </header>

      {/* Filter Parameters Bar */}
      {extractedParams.length > 0 && (
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t("editor.tabParams")}:
          </span>
          {extractedParams.map((param) => (
            <div key={param} className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <label className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                :{param}
              </label>
              <input
                type="text"
                placeholder={t("editor.paramPlaceholder")}
                value={paramValues[param] || ""}
                onChange={(e) => handleParamChange(param, e.target.value)}
                className="bg-transparent focus:outline-none text-slate-800 dark:text-slate-200 w-36 font-mono"
              />
            </div>
          ))}

          <button
            onClick={handleRunReport}
            disabled={isLoadingPreview}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 ml-auto"
          >
            {isLoadingPreview ? (
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{t("builder.runQuery")}</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Main Results Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        {!previewData ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            <p className="text-xs text-slate-500 max-w-sm">
              {t("preview.emptyRowsHint")}
            </p>
            <button
              onClick={handleRunReport}
              disabled={isLoadingPreview}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("builder.runQuery")}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Table Stats Subheader */}
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{previewData.executionTimeMs}ms</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>{previewData.rows.length} {t("preview.rowCount")}</span>
                </span>
              </div>

              <button
                onClick={() => setPreviewData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={t("common.cancel")}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DataTable (Thứ tự cột chuẩn: Checkbox -> STT -> Thao tác -> Dữ liệu) */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {/* 1. Checkbox */}
                    <th className="w-10 px-3 py-2 text-center">
                      <input
                        aria-label={t("common.selectAll")}
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>

                    {/* 2. STT */}
                    <th className="w-14 px-3 py-2 text-center font-mono">{t("common.orderNumber")}</th>

                    {/* 3. Thao tác / Hành động */}
                    <th className="w-20 px-3 py-2 text-center">{t("common.actions")}</th>

                    {/* 4. Các cột dữ liệu */}
                    {previewData.columns.map((col) => (
                      <th key={col} className="px-4 py-2 font-mono truncate">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {previewData.rows.map((row, idx) => {
                    const isSelected = selectedRows.has(idx);

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                            : idx % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-slate-50/40 dark:bg-slate-900/40"
                        }`}
                      >
                        {/* 1. Checkbox */}
                        <td className="px-3 py-2 text-center">
                          <input
                            aria-label={`Row ${idx + 1}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(idx)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* 2. STT */}
                        <td className="px-3 py-2 text-center text-slate-400">
                          {idx + 1}
                        </td>

                        {/* 3. Thao tác / Hành động */}
                        <td className="px-3 py-2 text-center">
                          <button
                            title={t("common.detail")}
                            onClick={() => setActiveDetailRow(row)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>

                        {/* 4. Các cột dữ liệu */}
                        {previewData.columns.map((col) => {
                          const val = row[col];
                          return (
                            <td
                              key={col}
                              className="px-4 py-2 text-slate-700 dark:text-slate-300 truncate max-w-xs"
                            >
                              {val !== null && val !== undefined
                                ? typeof val === "object"
                                  ? JSON.stringify(val)
                                  : String(val)
                                : <span className="text-slate-300 dark:text-slate-600 italic">null</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Row Detail View Modal */}
      {activeDetailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {t("preview.detailRowTitle")}
              </h3>
              <button
                onClick={() => setActiveDetailRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-lg text-xs font-mono overflow-auto max-h-80">
              {JSON.stringify(activeDetailRow, null, 2)}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveDetailRow(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                {t("common.close")}
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
      />
    </div>
  );
};
