# WORKSPACE RULES & FRONTEND ENGINEERING STANDARDS
# Hệ thống: Micro-Report Engine (Standalone Hybrid Dynamic Report Platform)
# Phiên bản: Enterprise Master Rules

================================================================================
I. NGUYÊN TẮC BẢO TOÀN HỆ THỐNG & PHẠM VI DỰ ÁN
================================================================================
1. BẢO TOÀN NỀN TẢNG CỐT LÕI (DO NOT REWRITE WORKING CODE):
   - Tuyệt đối KHÔNG viết lại các module Backend/Core đã hoàn thành:
     * 12 Bug Fixes (BUG-01 -> BUG-12: Quoted Alias, Dialect Pagination, TIMESTAMPTZ Sanitize, CTE Top-level).
     * 7 Core Gaps (GAP-01 -> GAP-07: DataSource Permissions, Pre-signed Token, Query Audit, Rate Limit).
     * Hạ tầng DWH Sync, Flyway Migration V1/V2/V3 và kịch bản CI pre-commit.
2. KHÔNG TỰ Ý THAY ĐỔI MÃ NGUỒN NGOÀI PHẠM VI TASK ĐƯỢC GIAO.

================================================================================
II. QUY HOẠCH CẤU TRÚC THƯ MỤC & RANH GIỚI KIẾN TRÚC (FSD)
================================================================================
1. Phạm vi thư mục Frontend đóng gói tập trung trong `src/frontend/src/features/dynamic-builder/`:
   - `model/`: `types.ts` (Data contracts, DTOs) và `useReportBuilderStore.ts` (Zustand Store).
   - `ui/`: Các khối Canvas thiết kế (`VisualGuiBuilder.tsx`, `StandaloneReportViewer.tsx`, `LiveDataPreviewTable.tsx`, `FriendlyErrorCard.tsx`, `SchemaTreeExplorer.tsx`).
   - `ui/bi/`: Toàn bộ Recharts BI components (`DynamicBarChart.tsx`, `DynamicLineChart.tsx`, `DynamicPieChart.tsx`, `KpiCard.tsx`, `BiDashboardView.tsx`).
   - `shared/locales/`: `vi.ts`, `en.ts` (100% chuỗi đa ngôn ngữ).
2. TUYỆT ĐỐI KHÔNG tự ý tạo các thư mục feature rác nằm ngoài kiến trúc chuẩn.

================================================================================
III. QUY CHUẨN TỐI ƯU HIỂN THỊ, ĐỘ RỘNG CỘT & RESPONSIVE (LAYOUT & PUBLISHING)
================================================================================
1. ĐỘ RỘNG CỘT (COLUMN SIZING & OVERFLOW):
   - Mọi cột trong DataTable hoặc Report Viewer phải có quy định độ rộng rõ ràng:
     * Cột Checkbox: Cố định `w-[40px]`, căn giữa.
     * Cột STT: Cố định `w-[50px]` - `w-[60px]`, căn giữa.
     * Cột Thao tác: Cố định `w-[70px]` - `w-[90px]`, căn giữa.
     * Cột Mã / Trạng thái / Ngày tháng: `min-w-[120px]` đến `w-[160px]`.
     * Cột Số tiền / Tỷ lệ %: `min-w-[140px]` đến `w-[180px]`.
     * Cột Tên / Diễn giải: Co giãn linh hoạt (`flex-1` hoặc `min-w-[220px]`), kèm thuộc tính `truncate` và Tooltip khi bị cắt chữ.
   - Bảng dữ liệu bắt buộc bọc trong container có `overflow-x: auto` và thanh cuộn mảnh (custom slim scrollbar).
   - Dòng tiêu đề (Header) bắt buộc có thuộc tính `sticky top-0` để không bị trôi khi cuộn dọc.

2. BẢO ĐẢM HIỂN THỊ TRÊN MỌI THIẾT BỊ (RESPONSIVE & EMBED IFRAME):
   - Màn hình Standalone Viewer và Canvas Builder phải tự thích ứng:
     * Màn hình lớn (Desktop >= 1280px): Grid chia 2 cột (Biểu đồ song song Bảng hoặc Form 4 cột).
     * Màn hình nhúng Iframe / Tablet (768px - 1279px): Grid tự co về 2 cột, Form lọc co về 2 cột.
     * Mobile (< 768px): Tự động xếp chồng dọc 1 cột (Stack layout), bảng cho phép vuốt ngang tự nhiên.
   - Khung nhúng Iframe: Không để thanh cuộn lồng kép (No double scrollbars); layout co giãn 100% width/height của iframe cha.

================================================================================
IV. TOÀN VẸN DỮ LIỆU, ĐỊNH DẠNG TIỀN TỆ & TỶ GIÁ (FINANCIAL & DATA INTEGRITY)
================================================================================
1. NGUYÊN TẮC CĂN CHỈNH (ALIGNMENT DISCIPLINE):
   - Cột Số tiền, Doanh thu, Số lượng, Điểm số: BẮT BUỘC CĂN PHẢI (`text-right`).
   - Cột Ngày tháng, Mã định danh, CCCD, SĐT, Trạng thái: BẮT BUỘC CĂN GIỮA (`text-center`).
   - Cột Tên, Địa chỉ, Mô tả văn bản: BẮT BUỘC CĂN TRÁI (`text-left`).

2. ĐỒNG BỘ ĐỊNH DẠNG TIỀN TỆ & TỶ GIÁ (NO DATA DRIFT):
   - Tiền tệ VNĐ: Format chuẩn phân cách hàng nghìn bằng dấu chấm hoặc phẩy nhất quán (`12.450.000.000 ₫` hoặc `12,450,000,000 VND`), có nhãn đơn vị rõ ràng.
   - Tiền tệ USD / Ngoại tệ: Format 2 chữ số thập phân (`$1,250.50`).
   - Tỷ lệ phần trăm (%): Luôn format chính xác 1-2 chữ số thập phân (`18.4%`, `5.25%`), không làm tròn cụt mất dữ liệu.
   - Tuyệt đối KHÔNG làm lệch tỷ giá/đơn vị giữa Biểu Đồ (Ví dụ: rút gọn `12.45B`) và Bảng Chi Tiết (Ví dụ: `12.450.000.000 ₫`).
   - XỬ LÝ NULL AN TOÀN (NULL-SAFETY): Khi giá trị là `null` hoặc `undefined`, BẮT BUỘC render ký tự gạch ngang `-` hoặc ô trống. TUYỆT ĐỐI KHÔNG in chữ `"null"`, `"undefined"` hay `"NaN"` lên giao diện người dùng.

================================================================================
V. CHỐNG ẢO GIÁC & RÁC GIAO DIỆN (ANTI-HALLUCINATION & VISUAL CLEANLINESS)
================================================================================
1. CHỐNG ICON VÀ BIỂU TƯỢNG VÔ NGHĨA (NO GHOST / PHANTOM ICONS):
   - Chỉ sử dụng bộ icon chuẩn từ `lucide-react` hoặc SVG có sẵn trong Design System.
   - CẤM TUYỆT ĐỐI tự ý chèn các emoji ngẫu nhiên (🔥, 🚀, ⚡, 💥) vào tiêu đề cột, form nhập liệu hoặc thông báo hệ thống nếu không có trong spec thiết kế.
   - Mỗi icon xuất hiện phải có mục đích nghiệp vụ rõ ràng (Icon Lọc, Icon Lịch, Icon Tìm Kiếm, Icon Tải Xuất).

2. CHỐNG DỮ LIỆU ẢO GIÁC (NO HARDCODED MOCK IN PRODUCTION FLOW):
   - Màn hình Standalone Viewer và Report Preview khi chạy thật PHẢI hiển thị 100% dữ liệu lấy từ API Backend.
   - CẤM render các text debug thô (ví dụ: `[object Object]`, `temp_test_123`, `TODO: fix this`) trên giao diện phát hành.

================================================================================
VI. QUY TẮC ZERO-HARDCODE VÀ ĐA NGÔN NGỮ (I18N 100%)
================================================================================
1. CẤM TUYỆT ĐỐI viết chuỗi text tiếng Việt hoặc tiếng Anh thô trực tiếp trong JSX/TSX.
2. 100% chuỗi hiển thị (tiêu đề trang, nhãn input, placeholder, tooltip, nút bấm, thông báo toast, modal confirm) bắt buộc phải khai báo tập trung trong `src/shared/locales/vi.ts` (và `en.ts`), sử dụng qua `useTranslation()` / `t(...)`.
3. Sử dụng CSS Variables cho toàn bộ màu sắc (`var(--primary)`, `var(--bg-surface)`, `var(--border-light)`), không hardcode mã màu hex rải rác.

================================================================================
VII. QUY CHUẨN BẢNG DỮ LIỆU DATATABLE BẮT BUỘC (MANDATORY 4-COLUMN RULE)
================================================================================
Mọi DataTable trong hệ thống phải tuân thủ nghiêm ngặt thứ tự 4 nhóm cột:
1. Cột 1: `Checkbox` (Chọn 1 hoặc nhiều dòng cho bulk actions)
2. Cột 2: `STT` (Số thứ tự tự tăng tính theo trang hiện tại)
3. Cột 3: `Thao tác` (Xem nhanh 👁️ Quick Sample, Sửa, Xóa, Drill-down 🔍)
4. Cột 4 trở đi: `Các cột dữ liệu nghiệp vụ` (Tên, Mã, Doanh thu, Trạng thái...)

================================================================================
VIII. STATE MANAGEMENT, TYPESCRIPT STRICT & BẢO MẬT GIAO DIỆN
================================================================================
1. STATE MANAGEMENT:
   - Toàn bộ trạng thái của mẫu báo cáo (Metadata, Joins, Selected Columns, Static/Dynamic Filters, Visual Config) được quản lý tập trung trong `useReportBuilderStore.ts`.
   - Đảm bảo đồng bộ 2 chiều: Mọi thay đổi ở No-Code GUI phải phản ánh chính xác sang Low-Code SQL Preview và ngược lại.
2. TYPESCRIPT STRICT DISCIPLINE:
   - CẤM TUYỆT ĐỐI sử dụng kiểu dữ liệu `any`. Mọi DTO, State, Props phải được định nghĩa kiểu tường minh trong `model/types.ts`.
   - Clean Imports: Loại bỏ 100% unused imports, nhóm import chuẩn (React -> Libs -> Aliases -> Types).
3. BẢO MẬT TRÊN GIAO DIỆN XUẤT BẢN (VIEWER SECURITY):
   - Màn hình `/embed/reports/viewer/[templateCode]` dành cho End-User: ẨN HOÀN TOÀN 100% mã SQL, Monaco Editor và Cây CSDL Schema.
   - Dữ liệu PII (SĐT, CCCD, Email) hiển thị trên bảng phải tuân theo quy tắc làm mờ (`090****567`).

================================================================================
IX. CỔNG KIỂM ĐỊNH TRƯỚC KHI HOÀN THÀNH (PRE-COMMIT VERIFICATION)
================================================================================
Trước khi kết thúc bất kỳ tác vụ nào, Agent bắt buộc phải tự chạy kiểm tra:
1. `cd src/frontend && npx tsc --noEmit` (Đạt 0 lỗi TypeScript).
2. `npm run lint` (Đạt 0 warning, 0 error ESLint).
3. Kịch bản kiểm tra cục bộ CI: `./scripts/local_ci.sh` (hoặc PowerShell trên Windows) PASS 100%.