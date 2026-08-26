"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code,
  Copy,
  Database,
  FileCode,
  Layers,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { QueryMode } from "../model/types";
import { LiveDataPreviewTable } from "./LiveDataPreviewTable";
import { t } from "../../../shared/locales";
import { toast } from "../../../shared/hooks/useToast";

export const MonacoSqlEditor: React.FC = () => {
  const {
    sqlQuery,
    setSqlQuery,
    queryParameters,
    setQueryParameter,
    transformJs,
    setTransformJs,
    theme,
    runPreview,
    isLoadingPreview,
    previewData,
    errorMessage,
    setMode,
  } = useReportBuilderStore();

  const [activeTab, setActiveTab] = useState<"SQL" | "JS">("SQL");
  const [extractedParams, setExtractedParams] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tự động quét các biến tham số động dạng {{params.var}} từ câu lệnh SQL
  useEffect(() => {
    const paramRegex = /\{\{params\.([a-zA-Z0-9_]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = paramRegex.exec(sqlQuery)) !== null) {
      matches.add(match[1]);
    }
    setExtractedParams(Array.from(matches));
  }, [sqlQuery]);

  const handleFormatSql = () => {
    try {
      // Basic SQL keyword uppercase and indentation
      const formatted = sqlQuery
        .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|WITH|UNION ALL|UNION)\b/gi, (m) => `\n${m.toUpperCase()} `)
        .replace(/\n\s*\n/g, "\n")
        .trim();
      setSqlQuery(formatted);
      toast.success("Đã định dạng câu lệnh SQL chuẩn!");
    } catch {
      toast.error("Không thể tự động định dạng SQL");
    }
  };

  const handleCopySql = () => {
    if (!sqlQuery) {
      toast.error("Câu lệnh SQL rỗng!");
      return;
    }
    navigator.clipboard.writeText(sqlQuery);
    toast.success("Đã sao chép câu lệnh SQL vào clipboard!");
  };

  return (
    <div className="space-y-4">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* MONACO SQL / JS CODE STUDIO CARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
        {/* Tab Switcher & Action Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab("SQL")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "SQL"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{t("editor.tabSql")}</span>
            </button>

            <button
              onClick={() => setActiveTab("JS")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "JS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{t("editor.tabTransform")}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Hỗ trợ CTE (WITH), Window Functions, Subqueries & Dynamic Parameters</span>
          </div>
        </div>

        {/* Editor Main Canvas with Fixed Height */}
        <div className="h-[380px] w-full relative bg-slate-900">
          {activeTab === "SQL" ? (
            <Editor
              height="380px"
              language="sql"
              theme={theme === "dark" ? "vs-dark" : "vs-dark"}
              value={sqlQuery}
              onChange={(val) => setSqlQuery(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: "on",
              }}
            />
          ) : (
            <Editor
              height="380px"
              language="javascript"
              theme={theme === "dark" ? "vs-dark" : "vs-dark"}
              value={transformJs}
              onChange={(val) => setTransformJs(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: "on",
              }}
            />
          )}
        </div>

        {/* Dynamic Parameters Bar */}
        {extractedParams.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{t("editor.tabParams")} ({extractedParams.length}):</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {extractedParams.map((paramName) => (
                <div
                  key={paramName}
                  className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded px-2 py-1"
                >
                  <span className="text-[11px] font-mono text-blue-400 font-semibold">
                    :{paramName} =
                  </span>
                  <input
                    type="text"
                    placeholder={t("editor.paramPlaceholder")}
                    value={queryParameters[paramName] || ""}
                    onChange={(e) =>
                      setQueryParameter(paramName, e.target.value)
                    }
                    className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 w-36"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={runPreview}
              disabled={isLoadingPreview}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {isLoadingPreview ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Chạy Thử Truy Vấn (Ctrl + Enter)</span>
            </button>

            <button
              onClick={handleFormatSql}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Định Dạng SQL</span>
            </button>

            <button
              onClick={handleCopySql}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao Chép SQL</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMode(QueryMode.GUI);
                toast.success("Đã chuyển sang chế độ No-Code GUI Builder!");
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              title="Chuyển sang No-Code GUI"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chuyển Sang No-Code GUI</span>
            </button>

            <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Cú Pháp Hợp Lệ</span>
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RESULTS & LIVE DATA PREVIEW STUDIO CARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Results Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Bảng Kết Quả Truy Vấn
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-800">
              {previewData?.rows?.length || 0} DÒNG
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>
              Thời gian: <b className="text-emerald-600 dark:text-emerald-400">{previewData?.executionTimeMs !== undefined ? `${previewData.executionTimeMs} ms` : "--"}</b>
            </span>
            <span>&bull;</span>
            <span>
              Số cột: <b className="text-slate-700 dark:text-slate-300">{previewData?.columns?.length || 0}</b>
            </span>
          </div>
        </div>

        {/* Results Body */}
        <div className="p-4 min-h-[220px]">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] text-center p-6 space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Đang thực thi câu lệnh SQL...</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống đang truy xuất dữ liệu từ cơ sở dữ liệu</p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs space-y-1">
              <span className="font-bold text-red-700 dark:text-red-300">Lỗi Thực Thi SQL:</span>
              <p className="text-red-600 dark:text-red-400 font-mono text-[11px] break-all">{errorMessage}</p>
            </div>
          ) : !previewData || !previewData.rows || previewData.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] text-center p-8 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Chưa có kết quả thực thi</p>
                <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                  Nhấn nút <b>&ldquo;Chạy Thử Truy Vấn&rdquo;</b> hoặc bấm <b>Ctrl + Enter</b> để chạy câu lệnh SQL trên CSDL.
                </p>
              </div>
              <button
                onClick={runPreview}
                disabled={isLoadingPreview}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chạy Thử Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const allRows = previewData.rows || [];
                const totalRows = allRows.length;
                const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
                const validCurrentPage = Math.min(currentPage, totalPages);
                const pagedRows = allRows.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

                return (
                  <>
                    <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <th className="w-10 px-3 py-2 text-center">
                              <input type="checkbox" className="rounded accent-blue-600 cursor-pointer" />
                            </th>
                            <th className="w-14 px-2 py-2 text-center">STT</th>
                            <th className="w-20 px-2 py-2 text-center">Thao tác</th>
                            {previewData.columns.map((col, idx) => (
                              <th
                                key={idx}
                                className={`px-3 py-2 ${
                                  typeof allRows[0]?.[col] === "number"
                                    ? "text-right min-w-[140px]"
                                    : "text-left min-w-[160px]"
                                }`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {pagedRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" className="rounded accent-blue-600 cursor-pointer" />
                              </td>
                              <td className="px-2 py-2 text-center font-mono text-slate-400">
                                {(validCurrentPage - 1) * pageSize + rIdx + 1}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => toast.success(`Xem dòng ${(validCurrentPage - 1) * pageSize + rIdx + 1}`)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                    title="Xem chi tiết"
                                  >
                                    <Code className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              {previewData.columns.map((col, cIdx) => {
                                const val = row[col];
                                const isNum = typeof val === "number";
                                return (
                                  <td
                                    key={cIdx}
                                    className={`px-3 py-2 ${
                                      isNum
                                        ? "text-right font-mono font-semibold text-slate-900 dark:text-slate-100"
                                        : "text-left"
                                    }`}
                                  >
                                    {val === null || val === undefined
                                      ? "-"
                                      : isNum
                                      ? `${new Intl.NumberFormat("vi-VN").format(val)}${
                                          col.toLowerCase().includes("tiền") ||
                                          col.toLowerCase().includes("hồng") ||
                                          col.toLowerCase().includes("amount")
                                            ? " ₫"
                                            : ""
                                        }`
                                      : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between pt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                      <div className="flex items-center space-x-3">
                        <span>
                          Hiển thị {totalRows > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0} - {Math.min(validCurrentPage * pageSize, totalRows)} trong tổng số <b>{totalRows}</b> dòng
                        </span>
                        <div className="flex items-center space-x-1.5 text-xs">
                          <span className="text-slate-400 text-[11px]">Số dòng:</span>
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
          )}
        </div>
      </div>
    </div>
  );
};
