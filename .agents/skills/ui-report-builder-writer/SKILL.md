---
name: ui-report-builder-writer
description: Sinh code giao diện (UI) cho phân hệ Báo Cáo Động Đa Nền Tảng (Micro-Report UI & Embed SDK).
  Sử dụng khi cần tạo màn hình thiết kế báo cáo hai chế độ (Visual GUI kéo thả bằng @dnd-kit + react-querybuilder và Monaco SQL Editor),
  cây duyệt CSDL (Schema Tree Explorer), bảng xem trước thời gian thực (Live Preview DataTable),
  hoặc trang nhúng Iframe Standalone và Reusable React Component SDK (@mascom/dynamic-report-builder).
---

# Micro-Report UI & Embed SDK Writer Skill

Skill này hướng dẫn sinh mã nguồn giao diện Next.js 14 / React 18 theo kiến trúc Feature-Sliced Design (FSD), hỗ trợ đa hệ thống và khả năng nhúng độc lập.

## 1. Nguyên Tắc Cốt Lõi
1. **Kiến Trúc Độc Lập & Theming:**
   * Mọi component phải hỗ trợ thuộc tính `theme="light" | "dark"` và `tenantId`.
   * Sử dụng CSS Modules hoặc Tailwind với design tokens chuẩn, không để hardcode màu sắc.
2. **Dual-Mode Report Builder:**
   * **Mode A (Visual GUI Builder):** Tích hợp `@dnd-kit/core` cho kéo thả cột và `react-querybuilder` cho cây điều kiện.
   * **Mode B (Monaco SQL Editor):** Tích hợp `@monaco-editor/react` (auto-complete, highlighting, format SQL) + Query Parameters Panel.
3. **DataTable Implementation Rule:**
   * Thứ tự cột: `Checkbox` $\rightarrow$ `STT` $\rightarrow$ `Thao tác` $\rightarrow$ `Dữ liệu`.

---

## 2. Cấu Trúc Thư Mục FSD Cho Module
```
src/
├── features/
│   └── dynamic-builder/
│       ├── api/
│       │   └── reportBuilderApi.ts
│       ├── model/
│       │   ├── types.ts
│       │   └── useReportBuilderStore.ts
│       └── ui/
│           ├── DynamicReportBuilder.tsx      # Reusable SDK Root Component
│           ├── SchemaTreeExplorer.tsx        # Cột trái duyệt CSDL
│           ├── VisualGuiBuilder.tsx          # Mode A: Kéo thả No-Code
│           ├── MonacoSqlEditor.tsx           # Mode B: Soạn thảo Low-Code
│           └── LiveDataPreviewTable.tsx      # Bảng xem trước dữ liệu
└── app/
    ├── (admin)/
    │   ├── reports/builder/page.tsx          # Trang quản trị chính
    │   └── reports/templates/page.tsx        # Trang quản trị mẫu
    └── (embed)/
        └── embed/reports/builder/page.tsx    # Trang Standalone Iframe
```

---

## 3. Mẫu Khởi Tạo Reusable Embed Component
```tsx
import React, { useEffect } from 'react';
import { useReportBuilderStore } from '../model/useReportBuilderStore';
import { SchemaTreeExplorer } from './SchemaTreeExplorer';
import { VisualGuiBuilder } from './VisualGuiBuilder';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { LiveDataPreviewTable } from './LiveDataPreviewTable';

export interface DynamicReportBuilderProps {
  engineUrl: string;
  tenantId: string;
  authToken?: string;
  apiKey?: string;
  theme?: 'light' | 'dark';
  defaultDatasourceCode?: string;
  onExportSuccess?: (taskInfo: any) => void;
}

export const DynamicReportBuilder: React.FC<DynamicReportBuilderProps> = ({
  engineUrl,
  tenantId,
  authToken,
  apiKey,
  theme = 'light',
  defaultDatasourceCode,
  onExportSuccess
}) => {
  const { mode, setMode, initSession } = useReportBuilderStore();

  useEffect(() => {
    initSession({ engineUrl, tenantId, authToken, apiKey, defaultDatasourceCode });
  }, [engineUrl, tenantId, authToken, apiKey, defaultDatasourceCode]);

  return (
    <div className={`dynamic-report-container theme-${theme}`}>
      <div className="builder-header">
        {/* Top Action Bar & Mode Switcher */}
      </div>
      <div className="builder-body">
        <SchemaTreeExplorer />
        <div className="builder-canvas">
          {mode === 'GUI' ? <VisualGuiBuilder /> : <MonacoSqlEditor />}
          <LiveDataPreviewTable />
        </div>
      </div>
    </div>
  );
};
```
