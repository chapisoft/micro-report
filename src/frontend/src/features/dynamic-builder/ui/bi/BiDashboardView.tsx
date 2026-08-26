"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Check,
  Eye,
  Grid,
  LineChart as LineChartIcon,
  Monitor,
  PieChart as PieChartIcon,
  Sliders,
  TrendingUp,
  X,
} from "lucide-react";
import { DynamicBarChart } from "./DynamicBarChart";
import { DynamicLineChart } from "./DynamicLineChart";
import { DynamicPieChart } from "./DynamicPieChart";
import { KpiCard } from "./KpiCard";
import { ChartType, ReportVisualConfigDto } from "../../model/types";
import { useReportBuilderStore } from "../../model/useReportBuilderStore";
import { t } from "../../../../shared/locales";
import { toast } from "../../../../shared/hooks/useToast";

interface BiDashboardViewProps {
  data?: Record<string, any>[];
  columns?: string[];
  onDrillDown?: (filterKey: string, filterValue: any) => void;
  onSwitchToViewer?: () => void;
}

const SAMPLE_BI_DATA: Record<string, any>[] = [
  { "TỈNH / THÀNH PHỐ": "Hà Nội", "TỔNG HOA HỒNG": 12450000000, "SỐ ĐƠN VỊ": 128 },
  { "TỈNH / THÀNH PHỐ": "TP. Hồ Chí Minh", "TỔNG HOA HỒNG": 18320500000, "SỐ ĐƠN VỊ": 156 },
  { "TỈNH / THÀNH PHỐ": "Đà Nẵng", "TỔNG HOA HỒNG": 6850200000, "SỐ ĐƠN VỊ": 89 },
  { "TỈNH / THÀNH PHỐ": "Hải Phòng", "TỔNG HOA HỒNG": 7210000000, "SỐ ĐƠN VỊ": 76 },
  { "TỈNH / THÀNH PHỐ": "Cần Thơ", "TỔNG HOA HỒNG": 4330000000, "SỐ ĐƠN VỊ": 58 },
];


export const BiDashboardView: React.FC<BiDashboardViewProps> = ({
  data: propData,
  columns: propColumns,
  onDrillDown,
  onSwitchToViewer,
}) => {
  const storePreview = useReportBuilderStore((s) => s.previewData);
  const storeColumns = useReportBuilderStore((s) => s.guiConfig.columns);
  const storeVisual = useReportBuilderStore((s) => s.guiConfig.visualConfig);
  const updateVisualConfig = useReportBuilderStore((s) => s.updateVisualConfig);

  const data =
    propData ||
    (storePreview?.rows && storePreview.rows.length > 0
      ? storePreview.rows
      : SAMPLE_BI_DATA);

  const columns =
    propColumns ||
    (storePreview?.columns && storePreview.columns.length > 0
      ? storePreview.columns
      : storeColumns.length > 0
      ? storeColumns.map((c) => c.alias || c.columnName)
      : Object.keys(data[0] || {}));

  const numericCols = React.useMemo(() => {
    return columns.filter((col) =>
      data.some(
        (row) =>
          typeof row[col] === "number" ||
          (!isNaN(Number(row[col])) && row[col] !== "" && row[col] !== null)
      )
    );
  }, [columns, data]);

  const categoryCols = React.useMemo(() => {
    return columns.filter((col) => !numericCols.includes(col));
  }, [columns, numericCols]);

  const [visualConfig, setVisualConfig] = useState<ReportVisualConfigDto>(() => ({
    chartType: storeVisual?.chartType || ChartType.BAR,
    xAxisColumn: storeVisual?.xAxisKey || categoryCols[0] || columns[0] || "",
    yAxisColumns: storeVisual?.yAxisKey
      ? [storeVisual.yAxisKey]
      : numericCols.length > 0
      ? [numericCols[0]]
      : [columns[1] || columns[0] || ""],
    categoryColumn: storeVisual?.xAxisKey || categoryCols[0] || columns[0] || "",
    valueColumn: storeVisual?.yAxisKey || numericCols[0] || columns[1] || columns[0] || "",
    kpiTitle: storeVisual?.chartTitle || "Tổng Doanh Thu / Chỉ Số Chính",
    kpiSubtitle: "Số liệu tổng hợp tự động",
    kpiValueColumn: storeVisual?.yAxisKey || numericCols[0] || columns[0] || "",
    kpiAggregation: "SUM",
    kpiFormat: "CURRENCY",
    showLegend: storeVisual?.showValueLabel !== false,
    showGrid: storeVisual?.showGrid !== false,
    numberFormat: storeVisual?.numberFormat || "full",
    currencyUnit: storeVisual?.currencyUnit || "VNĐ",
    colorPalette: Array.isArray(storeVisual?.colorPalette) ? storeVisual.colorPalette : ["#1d4ed8", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b"],
  }));

  // Tự động đồng bộ Trục X và Trục Y khi nguồn cột thay đổi một cách an toàn
  const columnsKey = columns.join(",");
  React.useEffect(() => {
    if (columns.length > 0) {
      setVisualConfig((prev) => {
        const isXValid = Boolean(prev.xAxisColumn && columns.includes(prev.xAxisColumn));
        const isYValid = Boolean(
          prev.yAxisColumns && prev.yAxisColumns.length > 0 && columns.includes(prev.yAxisColumns[0])
        );
        if (isXValid && isYValid) {
          return prev; // Không cần cập nhật -> ngăn chặn triệt để infinite loop
        }
        const bestX = categoryCols[0] || columns[0];
        const bestY = numericCols.length > 0 ? numericCols[0] : columns[1] || columns[0];
        return {
          ...prev,
          xAxisColumn: isXValid ? prev.xAxisColumn : bestX,
          yAxisColumns: isYValid ? prev.yAxisColumns : [bestY],
          categoryColumn: isXValid ? prev.categoryColumn : bestX,
          valueColumn: isYValid ? prev.valueColumn : bestY,
        };
      });
    }
  }, [columnsKey, categoryCols, numericCols, columns]);

  const [dataLimit, setDataLimit] = useState<number>(data.length > 20 ? 20 : 0);
  const [drillDownItem, setDrillDownItem] = useState<{ key: string; value: any } | null>(null);

  const displayData = React.useMemo(() => {
    if (dataLimit === 0 || data.length <= dataLimit) return data;
    return data.slice(0, dataLimit);
  }, [data, dataLimit]);

  const handleChartClick = (entry: any) => {
    if (entry && visualConfig.xAxisColumn && entry[visualConfig.xAxisColumn]) {
      setDrillDownItem({
        key: visualConfig.xAxisColumn,
        value: entry[visualConfig.xAxisColumn],
      });
      if (onDrillDown) {
        onDrillDown(visualConfig.xAxisColumn, entry[visualConfig.xAxisColumn]);
      }
    }
  };

  const handleSaveBi = () => {
    updateVisualConfig({
      chartType: visualConfig.chartType,
      xAxisKey: visualConfig.xAxisColumn,
      yAxisKey: visualConfig.yAxisColumns?.[0] || visualConfig.valueColumn || "",
      showValueLabel: visualConfig.showLegend,
      showGrid: visualConfig.showGrid,
      colorPalette: "corporate",
      numberFormat: (visualConfig.numberFormat as "compact" | "full") || "full",
      currencyUnit: visualConfig.currencyUnit || "VNĐ",
      chartTitle: visualConfig.kpiTitle || "Biểu Đồ Trực Quan Báo Cáo",
    });
    toast.success("Đã lưu cấu hình trực quan BI! Đã đồng bộ sang Màn Hình End-User.");
  };

  const handleSelectChartType = (type: ChartType) => {
    setVisualConfig((prev) => {
      const next = { ...prev, chartType: type };
      updateVisualConfig({
        chartType: type,
        xAxisKey: next.xAxisColumn,
        yAxisKey: next.yAxisColumns?.[0] || next.valueColumn || "",
      });
      return next;
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs space-y-2">
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
        <p>{t("bi.noChartData")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Header Row (Image 3) */}
      <div className="flex items-start justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Cấu Hình Trực Quan Hóa (BI Dashboard Studio)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tùy biến hiển thị biểu đồ phân tích và bảng số liệu trực quan cho người dùng cuối.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveBi}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Lưu Cấu Hình BI</span>
          </button>

          {onSwitchToViewer && (
            <button
              onClick={() => {
                handleSaveBi();
                onSwitchToViewer();
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Xem Màn Hình End-User ➔</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Grid (Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT 1 (Trái - 3.5 cols): 1. CHỌN LOẠI BIỂU ĐỒ & MAP TRỤC */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            1. Chọn Loại Biểu Đồ
          </div>

          {/* 2x2 Grid Chart Type Choice Cards */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectChartType(ChartType.BAR)}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                visualConfig.chartType === ChartType.BAR
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Cột (Bar)</span>
            </button>

            <button
              onClick={() => handleSelectChartType(ChartType.LINE)}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                visualConfig.chartType === ChartType.LINE
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <LineChartIcon className="w-5 h-5" />
              <span>Đường (Line)</span>
            </button>

            <button
              onClick={() => handleSelectChartType(ChartType.PIE)}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                visualConfig.chartType === ChartType.PIE
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <PieChartIcon className="w-5 h-5" />
              <span>Tròn (Donut)</span>
            </button>

            <button
              onClick={() => handleSelectChartType(ChartType.KPI)}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1.5 transition-all ${
                visualConfig.chartType === ChartType.KPI
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Thẻ KPI</span>
            </button>
          </div>

          {/* Trục X (Dimension) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Trục Phân Loại (Trục X)
            </label>
            <select
              value={visualConfig.xAxisColumn || ""}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  xAxisColumn: e.target.value,
                  categoryColumn: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Trục Y (Metric) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Trục Giá Trị / Số Liệu (Trục Y)
            </label>
            <select
              value={visualConfig.yAxisColumns?.[0] || ""}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  yAxisColumns: [e.target.value],
                  valueColumn: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c} {numericCols.includes(c) ? "(Số liệu)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Bảng Màu Chủ Đạo */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Bảng Màu Chủ Đạo
            </label>
            <select
              value={visualConfig.colorPalette?.[0] === "#059669" ? "emerald" : visualConfig.colorPalette?.[0] === "#ea580c" ? "sunset" : "corporate"}
              onChange={(e) => {
                const p = e.target.value;
                const pal =
                  p === "emerald"
                    ? ["#059669", "#10b981", "#34d399", "#6ee7b7"]
                    : p === "sunset"
                    ? ["#ea580c", "#f97316", "#fb923c", "#f59e0b"]
                    : ["#1d4ed8", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b"];
                setVisualConfig((prev) => ({
                  ...prev,
                  colorPalette: pal,
                }));
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="corporate">Xanh Doanh Nghiệp (Corporate Blue)</option>
              <option value="emerald">Xanh Ngọc Lục Bảo (Emerald Green)</option>
              <option value="sunset">Cam Hoàng Hôn (Sunset Orange)</option>
            </select>
          </div>
        </div>

        {/* CỘT 2 (Giữa - 6 cols): XEM TRƯỚC BIỂU ĐỒ (LIVE PREVIEW) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Xem Trước Biểu Đồ
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                  XEM TRƯỚC TRỰC TIẾP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {visualConfig.xAxisColumn && visualConfig.yAxisColumns?.[0]
                  ? `Phân tích ${visualConfig.yAxisColumns[0]} theo ${visualConfig.xAxisColumn}`
                  : "Trực quan hóa dữ liệu tổng hợp theo thời gian thực"}
              </p>
            </div>

            {/* Display limit buttons */}
            <div className="flex items-center space-x-1 text-[11px] shrink-0">
              <span className="text-slate-400 text-[10px]">Hiển thị:</span>
              <button
                onClick={() => setDataLimit(10)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  dataLimit === 10 ? "bg-blue-700 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setDataLimit(0)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  dataLimit === 0 ? "bg-blue-700 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Tất Cả
              </button>
            </div>
          </div>

          {/* Chart Rendering Canvas with Labels */}
          <div className="min-h-[280px] w-full flex items-center justify-center p-1">
            {visualConfig.chartType === ChartType.BAR && (
              <DynamicBarChart
                data={displayData}
                config={visualConfig}
                onBarClick={handleChartClick}
              />
            )}
            {visualConfig.chartType === ChartType.LINE && (
              <DynamicLineChart data={displayData} config={visualConfig} />
            )}
            {visualConfig.chartType === ChartType.PIE && (
              <DynamicPieChart data={displayData} config={visualConfig} onPieClick={handleChartClick} />
            )}
            {visualConfig.chartType === ChartType.KPI && (
              <div className="w-full max-w-sm">
                <KpiCard data={displayData} config={visualConfig} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Đơn vị: <b>{visualConfig.currencyUnit || "VNĐ"}</b> (Click cột để phân tích chi tiết)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Tổng {displayData.length} dòng</span>
          </div>
        </div>

        {/* CỘT 3 (Phải - 3 cols): 2. TÙY CHỌN HIỂN THỊ */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            2. Tùy Chọn Hiển Thị
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={visualConfig.showLegend !== false}
                onChange={(e) => setVisualConfig((prev) => ({ ...prev, showLegend: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span>Hiển thị chú giải số liệu</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={visualConfig.showGrid !== false}
                onChange={(e) => setVisualConfig((prev) => ({ ...prev, showGrid: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span>Hiển thị đường lưới</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span>Cho phép Drill-down chi tiết</span>
            </label>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Định dạng số
            </label>
            <select
              value={visualConfig.numberFormat || "full"}
              onChange={(e) => setVisualConfig((prev) => ({ ...prev, numberFormat: e.target.value as any }))}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Đầy đủ (12.450.000.000)</option>
              <option value="compact">Dạng rút gọn (1.2B / 500M)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drill-down detail modal */}
      {drillDownItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-3xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t("bi.drillDownModalTitle")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("bi.drillDownSubtitle")}{" "}
                  <span className="font-semibold text-blue-600">
                    {drillDownItem.key} = {String(drillDownItem.value)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setDrillDownItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">STT</th>
                    {columns.map((col) => (
                      <th key={col} className="py-2 px-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data
                    .filter((row) => String(row[drillDownItem.key]) === String(drillDownItem.value))
                    .map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        {columns.map((col) => (
                          <td key={col} className="py-2 px-3 font-mono">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


