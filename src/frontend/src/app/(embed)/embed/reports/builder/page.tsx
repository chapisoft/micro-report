"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DynamicReportBuilder } from "@/features/dynamic-builder/ui/DynamicReportBuilder";
import { ExportTask } from "@/features/dynamic-builder/model/types";

function EmbedBuilderContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "DEFAULT";
  const theme = (searchParams.get("theme") as "light" | "dark") || "light";
  const authToken = searchParams.get("token") || undefined;
  const defaultDatasourceCode = searchParams.get("datasource") || undefined;
  const listDatasource = searchParams.get("listDatasource") || searchParams.get("allowedDatasources") || undefined;

  const handleExportSuccess = (task: ExportTask) => {
    // Gửi sự kiện PostMessage sang parent window nếu nhúng qua Iframe
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        {
          type: "REPORT_EXPORTED",
          taskCode: task.taskCode,
          fileName: task.fileName,
          downloadUrl: task.downloadUrl,
          rowCount: task.rowCount,
          fileSizeBytes: task.fileSizeBytes,
        },
        "*"
      );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <DynamicReportBuilder
        tenantId={tenantId}
        theme={theme}
        authToken={authToken}
        defaultDatasourceCode={defaultDatasourceCode}
        listDatasource={listDatasource}
        onExportSuccess={handleExportSuccess}
      />
    </div>
  );
}

export default function EmbedReportBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-xs">
          Đang tải Trình Thiết Kế Báo Cáo Động...
        </div>
      }
    >
      <EmbedBuilderContent />
    </Suspense>
  );
}
