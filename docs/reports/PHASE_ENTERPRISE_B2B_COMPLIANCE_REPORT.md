# BÁO CÁO NGHIỆM THU KỸ THUẬT: PHASE ENTERPRISE B2B COMPLIANCE

- **Nhánh tính năng**: `feat/enterprise-b2b-compliance`
- **Mục tiêu**: Bảo mật Doanh nghiệp & Phân quyền tích hợp đa hệ thống (RLS, Scope Injection, Session DataSource Filter, PII Masking, Published Menu API)
- **Trạng thái**: ĐÃ HOÀN THÀNH VÀ KIỂM THỬ 100% PASS

---

## 1. Danh Sách Các Tính Năng Đã Triển Khai

### 1.1. Row-Level Security (RLS) & Scope Injection (Mục 10.2 & 2.2)
- Trích xuất tự động `data_scope` (`branch_id`, `province_code`, `department_id`...) từ Delegated JWT Token và HTTP Request Headers (`X-Data-Scope`, `X-Branch-Id`, `X-Province-Code`).
- Tự động nạp vào `TenantContext` cho từng luồng request.
- Tự động tiêm các biến Named Parameters `:scope_branch_id`, `:scope_province_code` vào `MapSqlParameterSource` và hỗ trợ placeholder `{{scope.branch_id}}`.
- Xử lý All-Scope (cấp Tổng công ty): Không ép điều kiện giả, tránh làm rỗng dữ liệu báo cáo.

### 1.2. Bộ Lọc Phân Quyền DataSource Theo Phiên (listDatasource - Mục 2.3)
- Trích xuất `allowedDataSources` từ JWT claims hoặc Header `X-Allowed-DataSources` / param `listDatasource`.
- Lọc danh mục kết nối chỉ hiển thị DataSource được ủy quyền.
- Chặn đứng 403 Forbidden (`SecurityViolationException`) nếu người dùng cố tình truy vấn hoặc xuất dữ liệu ngoài phạm vi được phân quyền.
- Khắc phục triệt để lỗi React Dependency Loop khi chuyển đổi DataSource: Tự động reset schema, xóa cột cũ và gán bảng gốc mới khi đổi CSDL trong `DynamicReportBuilder.tsx` & `useReportBuilderStore.ts`.

### 1.3. PII Data Masking - Làm Mờ Dữ Liệu Nhạy Cảm (ENH-07)
- Xây dựng tiện ích `DataMaskingUtils.java` sử dụng regex và quy tắc tên cột làm mờ:
  - Số điện thoại: `0901234567` -> `090****567` (hoặc `+84-90****567`).
  - CCCD/CMND: `001099123456` -> `0010******56` (hoặc `012***678`).
  - Email: `hoangmelinh@gmail.com` -> `h***@gmail.com`.
  - Số tài khoản ngân hàng: `1903678912345` -> `1903******2345`.
- Tự động bypass cho tài khoản có quyền `ADMIN`, `SUPER_ADMIN`, `DATA_MANAGER`.
- Tích hợp trực tiếp vào luồng Live Preview và Streaming Export (Excel/CSV), bảo toàn 100% cấu trúc `PoiStyleFactory` (Freeze Top Row, AutoFilter, `=SUM(...)` Grand Total formula).

### 1.4. API Xuất Bản Menu Riêng (Mục 4.2 & 9)
- Endpoint `GET /api/v1/reports/templates/published`: Trả về danh sách mẫu xuất bản kèm metadata Menu (`menuPath`, `menuCategory`, `menuIcon`, `templateCode`, `templateName`).
- Endpoint `POST /api/v1/reports/templates/{templateCode}/publish`: Kích hoạt xuất bản mẫu báo cáo thành Menu động cho CMS DIP và Micro-CRM.

---

## 2. Bảng Chi Tiết File Thay Đổi & Lý Do Kỹ Thuật

| STT | Đường Dẫn File | Thao Tác | Nội Dung & Mục Đích Kỹ Thuật |
| :---: | :--- | :---: | :--- |
| 1 | `src/backend/.../domain/model/ReportConstants.java` | MODIFY | Khai báo hằng số Header, Claim, Role và tiền tố `:scope_` (Zero-Hardcode). |
| 2 | `src/backend/.../domain/model/TenantContext.java` | MODIFY | Bổ sung `dataScope`, `allowedDataSources` và method `isAdmin()`. |
| 3 | `src/backend/.../web/filter/TenantAuthFilter.java` | MODIFY | Trích xuất `data_scope` và `allowed_datasources` từ JWT/Header, xử lý All-Scope. |
| 4 | `src/backend/.../domain/security/DynamicParameterBinder.java` | MODIFY | Tiêm tham số phạm vi `:scope_branch_id` và hỗ trợ placeholder `{{scope.var}}`. |
| 5 | `src/backend/.../domain/security/DataMaskingUtils.java` | NEW | Cung cấp thuật toán Regex và quy tắc nhận diện cột làm mờ PII. |
| 6 | `src/backend/.../application/service/QueryExecutionService.java` | MODIFY | Kiểm tra DataSource permission (403) và làm mờ dữ liệu preview. |
| 7 | `src/backend/.../application/service/SxssfStreamingExportService.java` | MODIFY | Kiểm tra DataSource permission và làm mờ cell value khi export Excel/CSV. |
| 8 | `src/backend/.../adapter/in/web/DataSourceController.java` | MODIFY | Lọc danh sách DataSource kết hợp `listDatasource` và `allowedDataSources`. |
| 9 | `src/backend/.../application/dto/ReportTemplateDto.java` | MODIFY | Bổ sung các trường metadata menu: `menuPath`, `menuCategory`, `menuIcon`. |
| 10 | `src/backend/.../application/service/ReportTemplateService.java` | MODIFY | Thêm method `publishTemplate` và mapping metadata menu. |
| 11 | `src/backend/.../adapter/in/web/ReportTemplateController.java` | MODIFY | Thêm endpoint `POST /{templateCode}/publish`. |
| 12 | `src/backend/.../security/DataMaskingUtilsTest.java` | NEW | Bộ Unit Test kiểm thử 9 test cases làm mờ PII và bypass Admin. |
| 13 | `src/backend/.../security/RowLevelSecurityTest.java` | NEW | Bộ Unit Test kiểm thử 3 test cases Scope Injection và RLS. |
| 14 | `src/backend/.../security/DataSourcePermissionTest.java` | NEW | Bộ Unit Test kiểm thử 2 test cases phân quyền DataSource và chặn 403. |
| 15 | `scripts/local_ci.ps1` | NEW | Script kiểm tra tự động Local CI trên Windows PowerShell. |

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Verification)

| Hạng Mục Kiểm Thử | Lệnh Thực Thi | Kết Quả Đạt Được |
| :--- | :--- | :---: |
| Backend Unit Tests | `.\gradlew.bat test --rerun-tasks` | **BUILD SUCCESSFUL (100% PASS)** |
| DataMaskingUtilsTest | 9 test cases (SĐT, CCCD, Email, STK, Admin bypass) | **100% PASS** |
| RowLevelSecurityTest | 3 test cases (Scope Injection, Placeholder, All-Scope) | **100% PASS** |
| DataSourcePermissionTest | 2 test cases (Session allowed, 403 Forbidden) | **100% PASS** |
| Frontend TypeCheck | `npx tsc --noEmit` | **0 errors** |
| Frontend ESLint | `npm run lint` | **0 warnings / 0 errors** |
| Published Menu API | `GET /api/v1/reports/templates/published?tenant=DIP_BHXH` | **Trả về JSON Menu chuẩn 100%** |
| Windows Local CI Runner | `.\scripts\local_ci.ps1` | **ALL PASS** |
