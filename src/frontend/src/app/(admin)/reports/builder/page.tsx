"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DynamicReportBuilder } from "@/features/dynamic-builder/ui/DynamicReportBuilder";

function ReportBuilderContent() {
  const searchParams = useSearchParams();
  const tenant = searchParams.get("tenant") || searchParams.get("tenantId");
  const listDatasource = searchParams.get("listDatasource");
  const token = searchParams.get("token") || searchParams.get("authToken");
  const apiKey = searchParams.get("apiKey");

  return (
    <div className="h-screen w-screen overflow-hidden">
      <DynamicReportBuilder
        tenantId={tenant || undefined}
        listDatasource={listDatasource || undefined}
        authToken={token || undefined}
        apiKey={apiKey || undefined}
        theme="light"
      />
    </div>
  );
}

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Đang tải trình thiết kế...</div>}>
      <ReportBuilderContent />
    </Suspense>
  );
}
