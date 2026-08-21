"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Code,
  FileCode,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { t } from "../../../shared/locales";

export const MonacoSqlEditor: React.FC = () => {
  const {
    sqlQuery,
    setSqlQuery,
    queryParameters,
    setQueryParameter,
    transformJs,
    setTransformJs,
    theme,
  } = useReportBuilderStore();

  const [activeTab, setActiveTab] = useState<"SQL" | "JS">("SQL");
  const [extractedParams, setExtractedParams] = useState<string[]>([]);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Tab Switcher & Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("SQL")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "SQL"
                ? "bg-blue-600 text-white shadow-sm"
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
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{t("editor.tabTransform")}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{t("editor.subtitle")}</span>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 relative">
        {activeTab === "SQL" ? (
          <Editor
            height="100%"
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
            }}
          />
        ) : (
          <Editor
            height="100%"
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
    </div>
  );
};
