"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Key,
  Layers,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { t } from "../../../shared/locales";

export const SchemaTreeExplorer: React.FC = () => {
  const {
    datasources,
    activeDatasourceCode,
    setActiveDatasource,
    schemaInfo,
    selectedTable,
    setSelectedTable,
    isLoadingSchema,
    toggleColumnSelection,
    guiConfig,
    setPrimaryTable,
  } = useReportBuilderStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTableExpand = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredTables = schemaInfo?.tables.filter((tItem) =>
    tItem.tableName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <aside className="w-80 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-sm">
      {/* Header & DataSource Picker */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-slate-800 dark:text-slate-200">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t("schema.title")}</span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">
            {schemaInfo?.databaseType || "JDBC"}
          </span>
        </div>

        <select
          aria-label={t("dwh.selectDatasource")}
          value={activeDatasourceCode}
          onChange={(e) => setActiveDatasource(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          {datasources.map((ds) => (
            <option key={ds.datasourceCode} value={ds.datasourceCode}>
              {ds.name} ({ds.dbType})
            </option>
          ))}
          {datasources.length === 0 && (
            <option value="">{t("common.noData")}</option>
          )}
        </select>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t("schema.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Schema Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingSchema ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs">{t("common.loading")}</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            {t("common.noData")}
          </div>
        ) : (
          filteredTables.map((table) => {
            const isExpanded = expandedTables[table.tableName] ?? false;
            const isPrimary = guiConfig.primaryTable === table.tableName;
            const isSelected = selectedTable?.tableName === table.tableName;

            return (
              <div
                key={table.tableName}
                className="rounded-md overflow-hidden transition-colors"
              >
                {/* Table Row */}
                <div
                  className={`flex items-center justify-between px-2.5 py-2 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                    isSelected
                      ? "bg-blue-50/70 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                  onClick={() => {
                    setSelectedTable(table);
                    toggleTableExpand(table.tableName);
                  }}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <TableIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="truncate text-xs font-mono">{table.tableName}</span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {isPrimary ? (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        Gốc
                      </span>
                    ) : (
                      <button
                        title="Đặt làm bảng chính"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryTable(table.tableName);
                        }}
                        className="text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        +Gốc
                      </button>
                    )}
                  </div>
                </div>

                {/* Columns List */}
                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-0.5">
                    {table.columns.map((col) => {
                      const isColSelected = guiConfig.columns.some(
                        (c) =>
                          c.tableName === table.tableName &&
                          c.columnName === col.columnName
                      );

                      return (
                        <div
                          key={col.columnName}
                          onClick={() =>
                            toggleColumnSelection(
                              table.tableName,
                              col.columnName
                            )
                          }
                          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-xs transition-colors ${
                            isColSelected
                              ? "bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            {col.isPrimaryKey ? (
                              <Key className="w-3 h-3 text-amber-500 shrink-0" />
                            ) : (
                              <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate font-mono">{col.columnName}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {col.dataType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
