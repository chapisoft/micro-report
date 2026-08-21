"use client";

import React from "react";
import { DynamicReportBuilder } from "@/features/dynamic-builder/ui/DynamicReportBuilder";

export default function ReportBuilderPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <DynamicReportBuilder tenantId="DEFAULT" theme="light" />
    </div>
  );
}
