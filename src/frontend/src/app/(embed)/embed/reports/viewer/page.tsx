"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StandaloneReportViewer } from "@/features/dynamic-builder/ui/StandaloneReportViewer";

function EmbedViewerContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || searchParams.get("templateCode") || "";
  const tenantId = searchParams.get("tenant") || searchParams.get("tenantId") || "DEFAULT";
  const token = searchParams.get("token") || searchParams.get("authToken") || undefined;
  const apiKey = searchParams.get("apiKey") || undefined;
  const theme = (searchParams.get("theme") as "light" | "dark") || "light";
  const listDatasource = searchParams.get("listDatasource") || searchParams.get("allowedDatasources") || undefined;

  return (
    <div className="h-screen w-screen overflow-hidden">
      <StandaloneReportViewer
        templateCode={code}
        tenantId={tenantId}
        authToken={token}
        apiKey={apiKey}
        theme={theme}
        listDatasource={listDatasource}
      />
    </div>
  );
}

export default function EmbedViewerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Report Viewer...</div>}>
      <EmbedViewerContent />
    </Suspense>
  );
}
