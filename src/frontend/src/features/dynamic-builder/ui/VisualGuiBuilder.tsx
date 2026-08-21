"use client";

import React, { useState } from "react";
import {
  Filter,
  GitCommit,
  Layers,
  Plus,
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

export const VisualGuiBuilder: React.FC = () => {
  const {
    schemaInfo,
    guiConfig,
    setPrimaryTable,
    updateColumnAlias,
    updateColumnAggregation,
    removeColumn,
    addJoinRelation,
    removeJoinRelation,
    addFilterCondition,
    removeFilterCondition,
    convertGuiToSql,
    setMode,
  } = useReportBuilderStore();

  // State thêm Join mới
  const [newJoin, setNewJoin] = useState<Partial<JoinRelation>>({
    joinType: JoinType.INNER,
  });
  // State thêm Filter mới
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    operator: FilterOperator.EQUALS,
    logic: FilterLogic.AND,
  });

  const availableTables = schemaInfo?.tables || [];

  const handleAddJoin = () => {
    if (
      newJoin.sourceTable &&
      newJoin.sourceColumn &&
      newJoin.targetTable &&
      newJoin.targetColumn
    ) {
      addJoinRelation({
        id: `join_${Date.now()}`,
        sourceTable: newJoin.sourceTable,
        sourceColumn: newJoin.sourceColumn,
        targetTable: newJoin.targetTable,
        targetColumn: newJoin.targetColumn,
        joinType: newJoin.joinType || JoinType.INNER,
      });
      setNewJoin({ joinType: JoinType.INNER });
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
      setNewFilter({ operator: FilterOperator.EQUALS, logic: FilterLogic.AND, value: "" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* 1. Bảng Dữ Liệu Gốc (Primary Table) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <TableIcon className="w-4 h-4 text-emerald-500" />
          <span>{t("builder.primaryTable")}</span>
        </div>
        <select
          aria-label={t("builder.primaryTable")}
          value={guiConfig.primaryTable}
          onChange={(e) => setPrimaryTable(e.target.value)}
          className="w-full md:w-80 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
        >
          <option value="">{t("builder.primaryTableSelectPlaceholder")}</option>
          {availableTables.map((tItem) => (
            <option key={tItem.tableName} value={tItem.tableName}>
              {tItem.tableName} ({tItem.tableType})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Cấu Hình Cột Dữ Liệu (Selected Columns) */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>{t("builder.columnsSection")} ({guiConfig.columns.length})</span>
          </div>
          <span className="text-xs text-slate-400">
            ({t("builder.addColumnsHint")})
          </span>
        </div>

        {guiConfig.columns.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-slate-400 text-xs">
            {t("common.noData")} ({guiConfig.primaryTable || "table"}.*)
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {guiConfig.columns.map((col) => (
              <div
                key={col.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {col.tableName}.{col.columnName}
                  </span>
                  <button
                    onClick={() => removeColumn(col.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                    title={t("builder.removeColumn")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t("builder.alias")}
                    value={col.alias || ""}
                    onChange={(e) => updateColumnAlias(col.id, e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-800 dark:text-slate-200 font-mono"
                  />
                  <select
                    aria-label={t("builder.aggregation")}
                    value={col.aggregation || AggregationType.NONE}
                    onChange={(e) =>
                      updateColumnAggregation(
                        col.id,
                        e.target.value as SelectedColumn["aggregation"]
                      )
                    }
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value={AggregationType.NONE}>None</option>
                    <option value={AggregationType.SUM}>SUM()</option>
                    <option value={AggregationType.COUNT}>COUNT()</option>
                    <option value={AggregationType.AVG}>AVG()</option>
                    <option value={AggregationType.MIN}>MIN()</option>
                    <option value={AggregationType.MAX}>MAX()</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Visual Join Builder */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <GitCommit className="w-4 h-4 text-purple-500" />
          <span>{t("builder.joinsSection")}</span>
        </div>

        {/* Existing Joins */}
        {guiConfig.joins.map((join) => (
          <div
            key={join.id}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
          >
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded font-semibold">
                {join.joinType} JOIN
              </span>
              <span>{join.targetTable}</span>
              <span className="text-slate-400">ON</span>
              <span>{join.sourceTable}.{join.sourceColumn}</span>
              <span className="text-slate-400">=</span>
              <span>{join.targetTable}.{join.targetColumn}</span>
            </div>
            <button
              onClick={() => removeJoinRelation(join.id)}
              className="text-slate-400 hover:text-red-500 p-1 rounded"
              title={t("common.delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add New Join Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg text-xs">
          <select
            aria-label={t("builder.joinType")}
            value={newJoin.joinType || JoinType.INNER}
            onChange={(e) =>
              setNewJoin({ ...newJoin, joinType: e.target.value as JoinType })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
          >
            <option value={JoinType.INNER}>INNER JOIN</option>
            <option value={JoinType.LEFT}>LEFT JOIN</option>
            <option value={JoinType.RIGHT}>RIGHT JOIN</option>
          </select>

          {/* Bảng Nguồn (Mặc định lấy Bảng chính nếu chưa chọn) */}
          <select
            aria-label={t("builder.joinSourceTable")}
            value={newJoin.sourceTable || guiConfig.primaryTable || ""}
            onChange={(e) => {
              const val = e.target.value;
              setNewJoin({
                ...newJoin,
                sourceTable: val,
                sourceColumn: "",
                targetTable: newJoin.targetTable === val ? "" : newJoin.targetTable,
              });
            }}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value="">-- {t("builder.joinSourceTable")} --</option>
            {availableTables.map((tItem) => (
              <option key={tItem.tableName} value={tItem.tableName}>
                {tItem.tableName}
              </option>
            ))}
          </select>

          {/* Cột Bảng Nguồn */}
          <select
            aria-label={t("builder.joinSourceColumn")}
            value={newJoin.sourceColumn || ""}
            onChange={(e) =>
              setNewJoin({ ...newJoin, sourceColumn: e.target.value })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value="">-- {t("builder.joinSourceColumn")} --</option>
            {availableTables
              .find(
                (t) =>
                  t.tableName ===
                  (newJoin.sourceTable || guiConfig.primaryTable)
              )
              ?.columns.map((col) => (
                <option key={col.columnName} value={col.columnName}>
                  {col.columnName} ({col.dataType})
                </option>
              ))}
          </select>

          {/* Bảng Đích: BẮT BUỘC LOẠI TRỪ BẢNG NGUỒN ĐỂ TRÁNH CHỌN TRÙNG BẢNG CHÍNH */}
          <select
            aria-label={t("builder.joinTargetTable")}
            value={newJoin.targetTable || ""}
            onChange={(e) =>
              setNewJoin({ ...newJoin, targetTable: e.target.value, targetColumn: "" })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value="">-- {t("builder.joinTargetTable")} --</option>
            {availableTables
              .filter(
                (tItem) =>
                  tItem.tableName !==
                  (newJoin.sourceTable || guiConfig.primaryTable)
              )
              .map((tItem) => (
                <option key={tItem.tableName} value={tItem.tableName}>
                  {tItem.tableName}
                </option>
              ))}
          </select>

          {/* Cột Bảng Đích */}
          <div className="flex space-x-1">
            <select
              aria-label={t("builder.joinTargetColumn")}
              value={newJoin.targetColumn || ""}
              onChange={(e) =>
                setNewJoin({ ...newJoin, targetColumn: e.target.value })
              }
              className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono flex-1"
            >
              <option value="">-- {t("builder.joinTargetColumn")} --</option>
              {availableTables
                .find((t) => t.tableName === newJoin.targetTable)
                ?.columns.map((col) => (
                  <option key={col.columnName} value={col.columnName}>
                    {col.columnName} ({col.dataType})
                  </option>
                ))}
            </select>
            <button
              onClick={handleAddJoin}
              disabled={
                !newJoin.sourceColumn ||
                !newJoin.targetTable ||
                !newJoin.targetColumn
              }
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded font-semibold transition-all cursor-pointer"
              title={t("builder.addJoin")}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Visual Filters */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>{t("builder.filtersSection")}</span>
        </div>

        {/* Existing Filters */}
        {guiConfig.filters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
          >
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded font-semibold">
                {filter.logic}
              </span>
              <span>{filter.tableName}.{filter.columnName}</span>
              <span className="text-amber-500 font-bold">{filter.operator}</span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                {filter.value}
              </span>
            </div>
            <button
              onClick={() => removeFilterCondition(filter.id)}
              className="text-slate-400 hover:text-red-500 p-1 rounded"
              title={t("common.delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg text-xs">
          <select
            aria-label={t("builder.filterLogic")}
            value={newFilter.logic || FilterLogic.AND}
            onChange={(e) =>
              setNewFilter({ ...newFilter, logic: e.target.value as FilterLogic })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold"
          >
            <option value={FilterLogic.AND}>AND</option>
            <option value={FilterLogic.OR}>OR</option>
          </select>

          {/* Chọn Bảng Lọc (Mặc định Bảng chính) */}
          <select
            aria-label={t("builder.filterTable")}
            value={newFilter.tableName || guiConfig.primaryTable || ""}
            onChange={(e) =>
              setNewFilter({ ...newFilter, tableName: e.target.value, columnName: "" })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value="">-- {t("builder.filterTable")} --</option>
            {availableTables.map((tItem) => (
              <option key={tItem.tableName} value={tItem.tableName}>
                {tItem.tableName}
              </option>
            ))}
          </select>

          {/* Chọn Cột Lọc từ Bảng đã chọn */}
          <select
            aria-label={t("builder.filterColumn")}
            value={newFilter.columnName || ""}
            onChange={(e) =>
              setNewFilter({ ...newFilter, columnName: e.target.value })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value="">-- {t("builder.filterColumn")} --</option>
            {availableTables
              .find(
                (t) =>
                  t.tableName ===
                  (newFilter.tableName || guiConfig.primaryTable)
              )
              ?.columns.map((col) => (
                <option key={col.columnName} value={col.columnName}>
                  {col.columnName} ({col.dataType})
                </option>
              ))}
          </select>

          <select
            aria-label={t("builder.filterOperator")}
            value={newFilter.operator || FilterOperator.EQUALS}
            onChange={(e) =>
              setNewFilter({ ...newFilter, operator: e.target.value as FilterOperator })
            }
            className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono"
          >
            <option value={FilterOperator.EQUALS}>=</option>
            <option value={FilterOperator.NOT_EQUALS}>!=</option>
            <option value={FilterOperator.GREATER_THAN}>&gt;</option>
            <option value={FilterOperator.GREATER_OR_EQUAL}>&gt;=</option>
            <option value={FilterOperator.LESS_THAN}>&lt;</option>
            <option value={FilterOperator.LESS_OR_EQUAL}>&lt;=</option>
            <option value={FilterOperator.LIKE}>LIKE</option>
            <option value={FilterOperator.IS_NULL}>IS NULL</option>
            <option value={FilterOperator.IS_NOT_NULL}>IS NOT NULL</option>
          </select>

          <div className="flex space-x-1">
            <input
              type="text"
              placeholder={t("builder.filterValuePlaceholder")}
              value={newFilter.value || ""}
              onChange={(e) =>
                setNewFilter({ ...newFilter, value: e.target.value })
              }
              className="p-2 bg-white dark:bg-slate-900 border rounded font-mono flex-1"
            />
            <button
              onClick={handleAddFilter}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold"
              title={t("builder.addFilter")}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
