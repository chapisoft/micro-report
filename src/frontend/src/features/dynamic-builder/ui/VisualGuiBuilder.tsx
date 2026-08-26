"use client";

import React, { useState } from "react";
import {
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code,
  Database,
  Eye,
  FileText,
  Filter,
  GripVertical,
  Layers,
  Link as LinkIcon,
  Play,
  Plus,
  RotateCcw,
  Search,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import {
  AggregationType,
  FilterCondition,
  FilterLogic,
  FilterOperator,
  JoinRelation,
  JoinType,
  SelectedColumn,
} from "../model/types";
import { t } from "../../../shared/locales";
import { toast } from "../../../shared/hooks/useToast";

export const VisualGuiBuilder: React.FC = () => {
  const {
    schemaInfo,
    guiConfig,
    updateMetadata,
    setPrimaryTable,
    updateColumnAlias,
    updateColumnAggregation,
    addFormulaColumn,
    removeColumn,
    reorderColumns,
    addJoinRelation,
    removeJoinRelation,
    addFilterCondition,
    removeFilterCondition,
    addDynamicParam,
    removeDynamicParam,
    convertGuiToSql,
    setMode,
    runPreview,
    isLoadingPreview,
    previewData,
    sqlQuery,
  } = useReportBuilderStore();



  // State thêm Join mới
  const [newJoin, setNewJoin] = useState<Partial<JoinRelation>>({
    joinType: JoinType.LEFT,
  });
  // State thêm Filter mới
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    operator: FilterOperator.EQUALS,
    logic: FilterLogic.AND,
  });
  // State thêm Dynamic Param mới
  const [newParam, setNewParam] = useState<{
    name: string;
    label: string;
    type: "Date" | "Dropdown" | "Text" | "Number";
    defaultValue: string;
    isRequired: boolean;
  }>({
    name: "",
    label: "",
    type: "Date",
    defaultValue: "",
    isRequired: false,
  });

  // State modal / form thêm công thức tính toán
  const [showFormulaForm, setShowFormulaForm] = useState(false);
  const [formulaAlias, setFormulaAlias] = useState("");
  const [formulaExpr, setFormulaExpr] = useState("");

  // Pagination state for Results Preview Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableTables = schemaInfo?.tables || [];
  const primaryTableObj = availableTables.find((t) => t.tableName === guiConfig.primaryTable);
  const secondaryTableObj = availableTables.find((t) => t.tableName === newJoin.targetTable);

  const handleAddJoin = () => {
    if (
      guiConfig.primaryTable &&
      newJoin.sourceColumn &&
      newJoin.targetTable &&
      newJoin.targetColumn
    ) {
      addJoinRelation({
        id: `join_${Date.now()}`,
        sourceTable: guiConfig.primaryTable,
        sourceColumn: newJoin.sourceColumn,
        targetTable: newJoin.targetTable,
        targetColumn: newJoin.targetColumn,
        joinType: newJoin.joinType || JoinType.LEFT,
      });
      setNewJoin({ joinType: JoinType.LEFT, targetTable: "", sourceColumn: "", targetColumn: "" });
    }
  };

  const handleAddFilter = () => {
    if (newFilter.tableName && newFilter.columnName && newFilter.value) {
      addFilterCondition({
        id: `filter_${Date.now()}`,
        tableName: newFilter.tableName,
        columnName: newFilter.columnName,
        operator: newFilter.operator || FilterOperator.EQUALS,
        value: newFilter.value,
        logic: newFilter.logic || FilterLogic.AND,
      });
      setNewFilter({ operator: FilterOperator.EQUALS, logic: FilterLogic.AND, value: "", tableName: guiConfig.primaryTable, columnName: "" });
    }
  };

  const handleAddParam = () => {
    if (newParam.name.trim() && newParam.label.trim()) {
      addDynamicParam({
        id: `param_${Date.now()}`,
        name: newParam.name.trim().replace(/^:/, ""),
        label: newParam.label.trim(),
        type: newParam.type,
        defaultValue: newParam.defaultValue,
        isRequired: newParam.isRequired,
      });
      setNewParam({
        name: "",
        label: "",
        type: "Date",
        defaultValue: "",
        isRequired: false,
      });
    }
  };

  const handleCreateFormula = () => {
    if (formulaAlias.trim() && formulaExpr.trim()) {
      addFormulaColumn(formulaAlias.trim(), formulaExpr.trim(), "NUMBER");
      setFormulaAlias("");
      setFormulaExpr("");
      setShowFormulaForm(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 dark:bg-slate-950">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* KHỐI 1: THÔNG TIN BÁO CÁO (METADATA HEADER) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <FileText className="w-4 h-4 text-blue-500" />
          <span>{t("builder.metadataSection")}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("builder.reportTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t("builder.reportTitlePlaceholder")}
              value={guiConfig.metadata?.title || ""}
              onChange={(e) => updateMetadata({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("builder.reportCode")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t("builder.reportCodePlaceholder")}
              value={guiConfig.metadata?.templateCode || ""}
              onChange={(e) => updateMetadata({ templateCode: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("builder.category")}
            </label>
            <select
              value={guiConfig.metadata?.category || "FINANCE"}
              onChange={(e) => updateMetadata({ category: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            >
              <option value="FINANCE">{t("builder.categoryFinance")}</option>
              <option value="OPERATIONS">{t("builder.categoryOperations")}</option>
              <option value="AGENT">{t("builder.categoryAgent")}</option>
              <option value="GENERAL">{t("builder.categoryGeneral")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("builder.defaultViewMode")}
            </label>
            <select
              value={guiConfig.metadata?.defaultViewMode || "BOTH"}
              onChange={(e) => updateMetadata({ defaultViewMode: e.target.value as any })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            >
              <option value="BOTH">{t("builder.viewModeBoth")}</option>
              <option value="CHART">{t("builder.viewModeChart")}</option>
              <option value="TABLE">{t("builder.viewModeTable")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KHỐI 2: BẢNG DỮ LIỆU & LIÊN KẾT (JOIN BUILDER) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <TableIcon className="w-4 h-4 text-emerald-500" />
            <span>{t("builder.primaryTable")}</span>
          </div>
          <span className="text-xs text-slate-400">
            {t("builder.selectPrimaryTableHint")}
          </span>
        </div>

        {/* Chọn Bảng Gốc */}
        <div className="flex items-center space-x-3">
          <select
            aria-label={t("builder.primaryTable")}
            value={guiConfig.primaryTable}
            onChange={(e) => setPrimaryTable(e.target.value)}
            className="w-full md:w-96 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 dark:text-slate-200"
          >
            <option value="">{t("builder.primaryTableSelectPlaceholder")}</option>
            {availableTables.map((tItem) => (
              <option key={tItem.tableName} value={tItem.tableName}>
                {tItem.tableName} ({tItem.tableType})
              </option>
            ))}
          </select>
        </div>

        {/* Visual Join Builder Sub-section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>{t("builder.joinsSection")} ({guiConfig.joins.length})</span>
            </div>
          </div>

          {/* Form thêm JOIN */}
          {guiConfig.primaryTable && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-wrap items-center gap-2 text-xs">
              <select
                value={newJoin.joinType || JoinType.LEFT}
                onChange={(e) => setNewJoin({ ...newJoin, joinType: e.target.value as JoinType })}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value={JoinType.LEFT}>LEFT JOIN</option>
                <option value={JoinType.INNER}>INNER JOIN</option>
                <option value={JoinType.RIGHT}>RIGHT JOIN</option>
              </select>

              <select
                value={newJoin.targetTable || ""}
                onChange={(e) => setNewJoin({ ...newJoin, targetTable: e.target.value, targetColumn: "" })}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
              >
                <option value="">{t("builder.joinTargetTable")}</option>
                {availableTables
                  .filter((t) => t.tableName !== guiConfig.primaryTable)
                  .map((t) => (
                    <option key={t.tableName} value={t.tableName}>
                      {t.tableName}
                    </option>
                  ))}
              </select>

              <span className="text-slate-400 font-semibold">ON</span>

              <select
                value={newJoin.sourceColumn || ""}
                onChange={(e) => setNewJoin({ ...newJoin, sourceColumn: e.target.value })}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
              >
                <option value="">{guiConfig.primaryTable}.cột</option>
                {primaryTableObj?.columns.map((c) => (
                  <option key={c.columnName} value={c.columnName}>
                    {guiConfig.primaryTable}.{c.columnName}
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-semibold">=</span>

              <select
                value={newJoin.targetColumn || ""}
                onChange={(e) => setNewJoin({ ...newJoin, targetColumn: e.target.value })}
                disabled={!newJoin.targetTable}
                className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="">{newJoin.targetTable || "bảng phụ"}.cột</option>
                {secondaryTableObj?.columns.map((c) => (
                  <option key={c.columnName} value={c.columnName}>
                    {newJoin.targetTable}.{c.columnName}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddJoin}
                disabled={!newJoin.targetTable || !newJoin.sourceColumn || !newJoin.targetColumn}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium transition-colors ml-auto"
              >
                {t("builder.addJoin")}
              </button>
            </div>
          )}

          {/* Danh sách JOIN hiện có */}
          {guiConfig.joins.length === 0 ? (
            <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-slate-400 text-xs">
              {t("builder.noJoins")}
            </div>
          ) : (
            <div className="space-y-2">
              {guiConfig.joins.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                >
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded">
                      {j.joinType || "LEFT"} JOIN
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{j.targetTable}</span>
                    <span className="text-slate-400">ON</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {j.sourceTable}.{j.sourceColumn} = {j.targetTable}.{j.targetColumn}
                    </span>
                  </div>
                  <button
                    onClick={() => removeJoinRelation(j.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KHỐI 3: CỘT HIỂN THỊ & HÀM TỔNG HỢP (COLUMNS & FORMULAS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t("builder.columnsSection")} ({guiConfig.columns.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFormulaForm(!showFormulaForm)}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t("builder.addFormulaColumn")}</span>
            </button>
          </div>
        </div>

        {/* Form thêm cột tính toán Formula */}
        {showFormulaForm && (
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Bí danh cột (VD: HOA_HONG_THUC_NHAN)"
                value={formulaAlias}
                onChange={(e) => setFormulaAlias(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
              />
              <input
                type="text"
                placeholder={t("builder.formulaExpr")}
                value={formulaExpr}
                onChange={(e) => setFormulaExpr(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono md:col-span-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFormulaForm(false)}
                className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCreateFormula}
                disabled={!formulaAlias.trim() || !formulaExpr.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        )}

        {/* DataTable danh sách Cột */}
        {guiConfig.columns.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-slate-400 text-xs">
            {t("builder.addColumnsHint")}
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-3 w-12 text-center">{t("common.orderNumber")}</th>
                  <th className="py-2 px-3 min-w-[180px]">{t("builder.columnName")}</th>
                  <th className="py-2 px-3 min-w-[160px]">{t("builder.alias")}</th>
                  <th className="py-2 px-3 w-36">{t("builder.aggregation")}</th>
                  <th className="py-2 px-3 w-28 text-center">{t("builder.dataType")}</th>
                  <th className="py-2 px-3 w-16 text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {guiConfig.columns.map((col, idx) => (
                  <tr
                    key={col.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono flex items-center justify-center space-x-1">
                      <GripVertical className="w-3 h-3 text-slate-300 dark:text-slate-600 cursor-grab" />
                      <span>{idx + 1}</span>
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {col.isFormula ? (
                        <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                          <Calculator className="w-3.5 h-3.5" />
                          <span>{col.formulaExpression}</span>
                        </div>
                      ) : (
                        <span>
                          {col.tableName}.{col.columnName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder={t("builder.alias")}
                        value={col.alias || ""}
                        onChange={(e) => updateColumnAlias(col.id, e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                      />
                    </td>
                    <td className="py-2 px-3">
                      {!col.isFormula ? (
                        <select
                          value={col.aggregation || AggregationType.NONE}
                          onChange={(e) =>
                            updateColumnAggregation(col.id, e.target.value as AggregationType)
                          }
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <option value={AggregationType.NONE}>NONE (Gốc)</option>
                          <option value={AggregationType.SUM}>SUM (Tổng)</option>
                          <option value={AggregationType.COUNT}>COUNT (Đếm)</option>
                          <option value={AggregationType.AVG}>AVG (Trung bình)</option>
                          <option value={AggregationType.MIN}>MIN (Tối thiểu)</option>
                          <option value={AggregationType.MAX}>MAX (Tối đa)</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Formula</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] rounded border border-slate-200 dark:border-slate-700">
                        {col.dataType || "VARCHAR"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeColumn(col.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title={t("builder.removeColumn")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* KHỐI 4: BỘ LỌC DỮ LIỆU TRƯỚC TRUY VẤN (WHERE & DYNAMIC PARAMS) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>{t("builder.filtersSection")}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {/* Cột Trái: Điều Kiện Lọc Cố Định (WHERE) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t("builder.staticFiltersTitle")} ({guiConfig.filters.length})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                ĐIỀU KIỆN LỌC (WHERE)
              </span>
            </div>

            {/* Form thêm Filter (Clean 3-row structured grid) */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2.5 shadow-2xs">
              {/* Hàng 1: Logic (4 cols) + Bảng Dữ Liệu (8 cols) */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Logic (Và/Hoặc)</label>
                  <select
                    value={newFilter.logic || FilterLogic.AND}
                    onChange={(e) => setNewFilter({ ...newFilter, logic: e.target.value as FilterLogic })}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={FilterLogic.AND}>VÀ (AND)</option>
                    <option value={FilterLogic.OR}>HOẶC (OR)</option>
                  </select>
                </div>

                <div className="col-span-8">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Bảng Dữ Liệu</label>
                  <select
                    value={newFilter.tableName || guiConfig.primaryTable}
                    onChange={(e) => setNewFilter({ ...newFilter, tableName: e.target.value, columnName: "" })}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 truncate cursor-pointer"
                  >
                    <option value={guiConfig.primaryTable}>{guiConfig.primaryTable}</option>
                    {guiConfig.joins.map((j) => (
                      <option key={j.targetTable} value={j.targetTable}>
                        {j.targetTable}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng 2: Cột Cần Lọc (6 cols) + Toán Tử (6 cols) */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cột Cần Lọc</label>
                  <select
                    value={newFilter.columnName || ""}
                    onChange={(e) => setNewFilter({ ...newFilter, columnName: e.target.value })}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 truncate cursor-pointer"
                  >
                    <option value="">-- Chọn Cột --</option>
                    {availableTables
                      .find((t) => t.tableName === (newFilter.tableName || guiConfig.primaryTable))
                      ?.columns.map((c) => (
                        <option key={c.columnName} value={c.columnName}>
                          {c.columnName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Toán Tử</label>
                  <select
                    value={newFilter.operator || FilterOperator.EQUALS}
                    onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as FilterOperator })}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={FilterOperator.EQUALS}>= (Bằng)</option>
                    <option value={FilterOperator.NOT_EQUALS}>!= (Khác)</option>
                    <option value={FilterOperator.GREATER_THAN}>&gt; (Lớn hơn)</option>
                    <option value={FilterOperator.LESS_THAN}>&lt; (Nhỏ hơn)</option>
                    <option value={FilterOperator.LIKE}>LIKE (Chứa chuỗi)</option>
                    <option value={FilterOperator.IN}>IN (Trong danh sách)</option>
                    <option value={FilterOperator.IS_NULL}>IS NULL (Rỗng)</option>
                    <option value={FilterOperator.IS_NOT_NULL}>IS NOT NULL (Không rỗng)</option>
                  </select>
                </div>
              </div>

              {/* Hàng 3: Giá Trị So Sánh (8 cols) + Nút Thêm (4 cols) */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-8">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Giá Trị So Sánh</label>
                  <input
                    type="text"
                    placeholder="Nhập giá trị..."
                    value={newFilter.value || ""}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                    disabled={newFilter.operator === FilterOperator.IS_NULL || newFilter.operator === FilterOperator.IS_NOT_NULL}
                    className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                <div className="col-span-4">
                  <button
                    onClick={handleAddFilter}
                    disabled={!newFilter.columnName || (!newFilter.value && newFilter.operator !== FilterOperator.IS_NULL && newFilter.operator !== FilterOperator.IS_NOT_NULL)}
                    className="w-full h-8 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded text-xs font-bold shadow-xs flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Thêm điều kiện lọc"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách Filters */}
            {guiConfig.filters.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs italic">
                {t("builder.noFilters")}
              </div>
            ) : (
              <div className="space-y-1.5">
                {guiConfig.filters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded text-[10px]">
                        {f.logic}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                        {f.tableName}.{f.columnName}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{f.operator}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">{f.value}</span>
                    </div>
                    <button
                      onClick={() => removeFilterCondition(f.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cột Phải: Tham Số Lọc Động (:param) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t("builder.dynamicParamsTitle")} ({(guiConfig.dynamicParams || []).length})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0">
                THAM SỐ ĐỘNG (:PARAM)
              </span>
            </div>

            {/* Form thêm Dynamic Param (Clean 2-row structured grid) */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2.5 shadow-2xs">
              {/* Hàng 1: Tên Biến Trong SQL (6 cols) + Kiểu Nhập Liệu (6 cols) */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tên Biến Trong SQL</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-[11px] font-mono text-slate-400 font-bold">:</span>
                    <input
                      type="text"
                      placeholder="from_date, province..."
                      value={newParam.name}
                      onChange={(e) => setNewParam({ ...newParam, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                      className="w-full h-8 pl-5 pr-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Kiểu Nhập Liệu</label>
                  <select
                    value={newParam.type}
                    onChange={(e) => setNewParam({ ...newParam, type: e.target.value as any })}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Date">Ngày tháng (Date)</option>
                    <option value="Dropdown">Danh sách (Dropdown)</option>
                    <option value="Text">Văn bản (Text)</option>
                    <option value="Number">Số / Tiền (Number)</option>
                  </select>
                </div>
              </div>

              {/* Hàng 2: Nhãn Hiển Thị (7 cols) + Nút Thêm (5 cols) */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nhãn Cho Người Xem</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Từ ngày, Tỉnh..."
                    value={newParam.label}
                    onChange={(e) => setNewParam({ ...newParam, label: e.target.value })}
                    className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-5">
                  <button
                    onClick={handleAddParam}
                    disabled={!newParam.name.trim() || !newParam.label.trim()}
                    className="w-full h-8 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded text-xs font-bold shadow-xs flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Tham Số</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Danh sách Dynamic Params */}
            {(guiConfig.dynamicParams || []).length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs italic">
                {t("builder.noDynamicParams")}
              </div>
            ) : (
              <div className="space-y-1.5">
                {(guiConfig.dynamicParams || []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded text-[10px]">
                        :{p.name}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-sans font-semibold truncate">
                        {p.label}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded shrink-0">
                        {p.type}
                      </span>
                    </div>
                    <button
                      onClick={() => removeDynamicParam(p.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOOTER ACTION BAR (IMAGE 2) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex-wrap gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Sẵn sàng thực thi &bull; CSDL: <span className="font-semibold text-slate-900 dark:text-slate-100">{schemaInfo?.databaseType || "Oracle XE"} (DIP Core OLTP)</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              convertGuiToSql();
              toast.success("Đã đồng bộ và định dạng câu lệnh SQL!");
            }}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
          >
            Định Dạng SQL
          </button>
          <button
            onClick={runPreview}
            disabled={isLoadingPreview}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isLoadingPreview ? t("common.executing") : "Chạy Thử Truy Vấn (Ctrl+Enter)"}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RESULTS & QUERY EXECUTION STUDIO CARD (IMAGE 2) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Results Tab Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <button className="flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs">
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng Kết Quả ({previewData?.rows?.length || 0} Dòng)</span>
            </button>
            <button
              onClick={() => {
                convertGuiToSql();
                setMode("SQL" as any);
              }}
              className="flex items-center space-x-1.5 px-3 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded text-xs font-semibold cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã Truy Vấn SQL</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Thời gian: <b className="text-emerald-600 dark:text-emerald-400">{previewData?.executionTimeMs !== undefined ? `${previewData.executionTimeMs} ms` : "--"}</b>
            </span>
            <span>&bull;</span>
            <span>
              Số dòng: <b className="text-slate-700 dark:text-slate-300">{previewData?.rows?.length || 0}</b>
            </span>
            <button
              onClick={() => {
                const sql = sqlQuery || convertGuiToSql();
                navigator.clipboard.writeText(sql);
                toast.success("Đã sao chép câu lệnh SQL vào clipboard!");
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Sao Chép SQL
            </button>
          </div>
        </div>

        {/* Split Grid Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[280px]">
          {/* Cột Trái (7 cols): Dữ Liệu Trả Về (Server-side Preview) */}
          <div className="lg:col-span-7 p-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-center p-6 space-y-3">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Đang thực thi truy vấn...</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống đang truy xuất dữ liệu từ cơ sở dữ liệu</p>
                </div>
              </div>
            ) : !previewData || !previewData.rows || previewData.rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[240px] text-center p-8 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Chưa có dữ liệu xem trước</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                    Nhấn nút <b>&ldquo;Chạy Thử Truy Vấn&rdquo;</b> hoặc bấm <b>Ctrl + Enter</b> để thực thi và tải dữ liệu từ CSDL.
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
              <div>
                {(() => {
                  const allRows = previewData.rows || [];
                  const totalRows = allRows.length;
                  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
                  const validCurrentPage = Math.min(currentPage, totalPages);
                  const pagedRows = allRows.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Dữ Liệu Trả Về ({totalRows} dòng)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Thời gian chạy: {previewData.executionTimeMs} ms
                        </span>
                      </div>

                      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] tracking-wider">
                              <th className="w-10 px-3 py-2 text-center">
                                <input type="checkbox" className="rounded cursor-pointer" />
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
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="px-3 py-2 text-center">
                                  <input type="checkbox" className="rounded cursor-pointer" />
                                </td>
                                <td className="px-2 py-2 text-center font-mono text-slate-400">
                                  {(validCurrentPage - 1) * pageSize + rIdx + 1}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => toast.success(`Xem chi tiết dòng ${(validCurrentPage - 1) * pageSize + rIdx + 1}`)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                      title="Xem chi tiết"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => toast.success(`Drill-down dòng ${(validCurrentPage - 1) * pageSize + rIdx + 1}`)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                                      title="Drill-down phân tích"
                                    >
                                      <Search className="w-3.5 h-3.5" />
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

          {/* Cột Phải (5 cols): SQL Query Sinh Tự Động (Dialect: Oracle) */}
          <div className="lg:col-span-5 p-4 flex flex-col justify-between space-y-2 bg-slate-950 text-slate-100 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">
                  Câu Lệnh SQL Sinh Tự Động (Oracle)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  CÚ PHÁP ORACLE
                </span>
              </div>

              <pre className="text-sky-400 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-blue-800">
                {sqlQuery || convertGuiToSql()}
              </pre>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Công Cụ AST: JSqlParser</span>
              <span className="text-emerald-400">An Toàn: Chỉ Cho Phép SELECT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


