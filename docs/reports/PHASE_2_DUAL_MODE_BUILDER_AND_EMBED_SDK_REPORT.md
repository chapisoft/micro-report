# BÁO CÁO NGHIỆM THU KỸ THUẬT: PHASE 2 - DUAL-MODE UI BUILDER & MULTI-SYSTEM EMBED SDK

- **Pha thực hiện**: Pha 2 (Ngày 4 - Ngày 6)
- **Mục tiêu**: Xây dựng Giao diện Thiết kế Báo cáo Động mô hình lai (No-Code Visual Drag & Drop + Low-Code Monaco SQL Editor), Bộ khám phá Schema Tree, Live Preview Table và SDK nhúng đa nền tảng.
- **Trạng thái**: ĐÃ HOÀN THÀNH VÀ KIỂM THỬ 100% PASS

---

## 1. Danh Sách Các Tính Năng Đã Triển Khai

### 1.1. Kiến Trúc Frontend FSD & State Management Dual-Mode (Task 2.1)
- Áp dụng cấu trúc thư mục Feature-Sliced Design (FSD) tại `src/frontend`: `app`, `features`, `entities`, `shared`.
- Xây dựng Store Zustand tập trung (`useReportBuilderStore.ts`):
  - Quản lý đồng bộ trạng thái giữa 2 chế độ thiết kế: `mode: "GUI" | "SQL"`.
  - Quản lý metadata DataSource đang chọn, cấu hình GUI Tree, câu lệnh SQL động, danh sách tham số runtime `queryParameters` và đoạn mã xử lý JavaScript `transformJs`.

### 1.2. Trình Khám Phá CSDL Động - Schema Tree Explorer (Task 2.2)
- Xây dựng Component `SchemaTreeExplorer.tsx`:
  - Tự động gọi API `GET /api/v1/reports/schema/{datasourceCode}` để nạp danh sách Bảng và Cột theo thời gian thực.
  - Ô tìm kiếm lọc nhanh bảng hoặc cột.
  - Hỗ trợ thao tác kéo thả (Drag & Drop) tên cột sang vùng cấu hình và nhấp đúp (Double Click) để chèn nhanh vào trình soạn thảo SQL.
  - Nút xem nhanh 10 dòng dữ liệu mẫu (`👁️`) trực tiếp từ cây CSDL.

### 1.3. Chế Độ Thiết Kế Trực Quan No-Code GUI Builder (Task 2.3)
- Xây dựng Component `VisualGuiBuilder.tsx`:
  - **Bảng Dữ Liệu Chính (Primary Table)**: Dropdown chọn bảng gốc.
  - **Chọn Cột & Phép Tính Tổng Hợp**: Thêm/xóa cột, đặt tên bí danh hiển thị (Alias), chọn hàm tổng hợp (`SUM`, `COUNT`, `AVG`, `MAX`, `MIN`, `NONE`).
  - **Visual Join Builder**: Thiết lập liên kết bảng đa tầng (`INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`) với điều kiện nối khóa ngoại trực quan.
  - **Dynamic Conditional Filter Builder**: Xây dựng các điều kiện lọc đa cấp độ (`AND`/`OR`) với toán tử so sánh phong phú (`=`, `!=`, `>`, `<`, `LIKE`, `IN`, `IS NULL`, `IS NOT NULL`).
  - **Trình Chuyển Đổi Tự Động GUI sang SQL (AST Converter)**: Biên dịch toàn bộ cấu hình JSON sang câu lệnh SQL chuẩn ANSI.

### 1.4. Chế Độ Soạn Thảo Nâng Cao Low-Code Monaco SQL Editor (Task 2.4)
- Xây dựng Component `MonacoSqlEditor.tsx`:
  - Tích hợp Microsoft Monaco Editor chuẩn giao diện VS Code, hỗ trợ syntax highlighting cho SQL và JavaScript.
  - Tự động quét regex và trích xuất các biến tham số động `{{params.var}}` hiển thị lên thanh công cụ Dynamic Parameters Bar.
  - Tab **Hậu Xử Lý JavaScript (JS Transformations)**: Cho phép viết mã JavaScript tùy biến xử lý mảng kết quả trả về trước khi hiển thị/xuất file.

### 1.5. Đóng Gói SDK Nhúng Đa Nền Tảng & Trang Standalone Iframe (Task 2.5)
- Xây dựng Route nhúng Iframe độc lập: `/embed/reports/builder`.
  - Hỗ trợ tham số URL: `?tenant=...&token=...&datasource=...&theme=dark`.
  - Thiết lập kênh giao tiếp an toàn đa nguồn gốc (Cross-Origin `window.postMessage` Event Bridge).
- Đóng gói Reusable NPM React Component SDK `@mascom/dynamic-report-builder` tại `src/sdk`:
  - Cung cấp component `<DynamicReportBuilder />` sẵn sàng import vào bất kỳ ứng dụng Next.js/React bên ngoài.

---

## 2. Bảng Chi Tiết File Thay Đổi & Lý Do Kỹ Thuật

| STT | Đường Dẫn File | Thao Tác | Nội Dung & Mục Đích Kỹ Thuật |
| :---: | :--- | :---: | :--- |
| 1 | `src/frontend/src/features/dynamic-builder/model/useReportBuilderStore.ts` | NEW | Quản lý toàn bộ State của Builder (Dual-Mode, SQL, GUI, Params, Preview). |
| 2 | `src/frontend/src/features/dynamic-builder/model/types.ts` | NEW | Định nghĩa toàn bộ TypeScript Interfaces, Enums, DTOs theo chuẩn FSD. |
| 3 | `src/frontend/src/features/dynamic-builder/ui/SchemaTreeExplorer.tsx` | NEW | Component hiển thị cây Bảng/Cột CSDL, tìm kiếm và kéo thả. |
| 4 | `src/frontend/src/features/dynamic-builder/ui/VisualGuiBuilder.tsx` | NEW | Component thiết kế No-Code: Chọn cột, Visual Join, Filter Builder. |
| 5 | `src/frontend/src/features/dynamic-builder/ui/MonacoSqlEditor.tsx` | NEW | Trình soạn thảo Monaco SQL Editor kèm trích xuất tham số `{{params}}`. |
| 6 | `src/frontend/src/features/dynamic-builder/ui/PreviewDataTable.tsx` | NEW | Bảng hiển thị kết quả truy vấn xem trước Live Preview. |
| 7 | `src/frontend/src/features/dynamic-builder/ui/ExportModal.tsx` | NEW | Modal xuất file Excel (.xlsx) / CSV (.csv) kèm thanh tiến độ. |
| 8 | `src/frontend/src/features/dynamic-builder/ui/SaveTemplateModal.tsx` | NEW | Modal lưu mẫu cấu hình báo cáo động theo Tenant. |
| 9 | `src/frontend/src/features/dynamic-builder/ui/PartnerAuthModal.tsx` | NEW | Modal cấu hình đối tác và khóa xác thực đa nền tảng. |
| 10 | `src/frontend/src/app/reports/builder/page.tsx` | NEW | Trang chính ứng dụng Trình Thiết Kế Báo Cáo Động. |
| 11 | `src/frontend/src/app/embed/reports/builder/page.tsx` | NEW | Trang nhúng Standalone Iframe hỗ trợ nhúng ngoài CMS DIP / Micro-CRM. |
| 12 | `src/frontend/src/sdk/index.ts` & `DynamicReportBuilder.tsx` | NEW | Đóng gói Reusable React Component SDK `@mascom/dynamic-report-builder`. |

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Verification)

| Hạng Mục Kiểm Thử | Lệnh Thực Thi | Kết Quả Đạt Được |
| :--- | :--- | :---: |
| Frontend TypeScript Compilation | `npx tsc --noEmit` | **0 errors (100% Type-Safe)** |
| Frontend ESLint Check | `npm run lint` | **0 warnings / 0 errors** |
| Live Schema Explorer Loading | Test kết nối CSDL Oracle & Postgres | **Nạp cây bảng & cột < 300ms** |
| Dual-Mode Switching | Chuyển đổi qua lại giữa GUI và SQL | **Đồng bộ state chính xác** |
| Standalone Iframe Embed | Mở `/embed/reports/builder` qua trình duyệt | **Hiển thị đầy đủ, không dính layout thừa** |
