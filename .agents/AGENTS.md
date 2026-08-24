# Workspace Rules — Micro-Report (Standalone Dynamic Report Engine)

## 1. Tổng Quan Dự Án
`micro-report` là phân hệ **Báo Cáo Động Độc Lập (Standalone Hybrid Dynamic Report Engine)** của Chapisoft/MASCOM, được xây dựng theo mô hình dịch vụ cắm ghép (Pluggable Microservice) phục vụ đa người thuê (Multi-Tenancy) cho nhiều hệ sinh thái: DIP Platform, Micro-CRM, Natcash và các ứng dụng doanh nghiệp khác.

---

## 2. Server Deployment & Operations Rules (Kiểm Soát Triển Khai Máy Chủ)
1. **DO NOT auto-deploy to remote servers:** Tuyệt đối **KHÔNG tự ý deploy, restart container hoặc chạy lệnh tác động lên máy chủ từ xa** (máy chủ DIP `210.211.102.99`, Staging, Production) khi chưa có yêu cầu rõ ràng, tường minh từ người dùng.
2. **Mặc định kiểm thử cục bộ (Local First):** Mọi thay đổi mã nguồn, tính năng hay cấu hình chỉ được build, chạy và kiểm định tại môi trường cục bộ qua `./scripts/local_ci.sh`. Chỉ thực thi lệnh SSH deploy khi nhận được chỉ định trực tiếp từ người dùng (ví dụ: *"deploy lên server"*).

---

## 3. Source Control Rules (Kiểm Soát Mã Nguồn)
1. **DO NOT auto-commit code:** Tuyệt đối không tự ý chạy `git add` hoặc `git commit` khi chưa có yêu cầu rõ ràng từ người dùng.
2. **Bắt buộc review `git diff` trước khi commit:** Luôn kiểm tra kỹ diff để đảm bảo không xóa nhầm code thật hay chèn code rác.
3. **Git Workflow:** Làm việc trực tiếp trên nhánh `main` (Trunk-based / Single Branch Workflow, không sử dụng Git Flow). Kiểm định `./scripts/local_ci.sh` đạt 100% PASS trước khi commit/push.

---

## 4. Coding Conventions & Architecture Standards

### 4.1. Zero-Hardcode Standard (Quy Chuẩn Không Hardcode)
* **Backend Java Spring Boot:**
  * Tuyệt đối KHÔNG hardcode magic strings, magic numbers, mã mặc định (như `"DEFAULT"`, `"all"`, `"ACTIVE"`, `"SYSTEM"`, pool sizes, query timeouts, header names...).
  * Bắt buộc khai báo tập trung trong `ReportConstants.java` và sử dụng các Domain Enums (`QueryMode`, `TemplateStatus`, `TaskStatus`, `DatabaseType`, `DataSourceStatus`).
* **Frontend & React SDK:**
  * Tuyệt đối KHÔNG hardcode chuỗi trạng thái, chế độ truy vấn hay thông số kích thước. Phải sử dụng Enums và `BUILDER_CONSTANTS` trong `types.ts`.
  * **100% Zero Hardcoded Text:** Tất cả các chuỗi text hiển thị trên UI, tiêu đề modal, tên cột, placeholder, tooltip, nút bấm, thông báo toast/confirm bắt buộc phải lấy qua hệ thống đa ngôn ngữ `t("key")` từ `src/shared/locales/` (`vi.ts` và `en.ts`).

### 4.2. Clean Imports Standard (Java Backend)
* **Tuyệt đối KHÔNG sử dụng Fully Qualified Names (FQN)** trong thân code, method signature hay casting.
* **Zero Unused Imports:** Loại bỏ 100% các câu lệnh import thừa sau khi refactor.
* **Quy chuẩn 4 nhóm import phân cách bằng 1 dòng trống:**
  1. `import io.chapisoft.report.*` (Project models, DTOs, Services)
  2. `import org.springframework.*`, `import lombok.*`, `import com.github.jsqlparser.*`... (Third-party)
  3. `import java.util.*`, `import java.time.*`, `import java.io.*`... (JDK standard)
  4. `import static ...` (Static imports ở cuối cùng).

### 4.3. SQL Security Sandbox & Multi-Tenancy Rules
1. **JSqlParser AST Sandbox:** 100% các câu lệnh SQL từ người dùng phải đi qua `SqlSecurityAstValidator`. Tuyệt đối cấm các lệnh DML/DDL (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`, `CALL`). Chỉ chấp nhận `SELECT` hoặc `WITH ... SELECT`.
2. **Dynamic Parameter Binding:** Các biến `{{params.var}}` bắt buộc phải được bind qua Named Parameters `:param_var` kèm validation kiểu dữ liệu để chống SQL Injection.
3. **Cô Lập Đa Người Thuê (Multi-Tenant Isolation):** Mọi truy vấn metadata mẫu báo cáo và DataSource bắt buộc phải kèm điều kiện `WHERE TENANT_ID = :tenantId`.
4. **Read-Only Database Connections:** Tất cả các kết nối DataSource ngoại vi đến CSDL đích phải được khởi tạo với cờ `isReadOnly = true`.

### 4.4. Hiệu Năng & Quản Trị Bộ Nhớ (Memory & Streaming)
* **SXSSF Streaming:** Khi xuất dữ liệu Excel lớn (tới 100.000 dòng), bắt buộc sử dụng Apache POI `SXSSFWorkbook(500)` để ghi theo dòng và flush đĩa liên tục, giữ RAM footprint dưới 50MB.
* **Query Timeout:** Luôn khống chế `statement_timeout = 30000;` (30 giây) và ép `LIMIT :maxRows` trên các câu lệnh preview.

### 4.5. UI Implementation Rules (DataTable)
Tất cả các bảng dữ liệu DataTable trên Frontend phải tuân thủ thứ tự cột từ trái sang phải:
1. `Checkbox` (chọn nhiều dòng)
2. `STT` (số thứ tự)
3. `Thao tác / Hành động` (Sửa, Xóa, Chi tiết, Chạy thử)
4. `Các cột dữ liệu` (Mã, Tên, Trạng thái, v.v.)

---

## 5. Exporting Markdown to Word (Docx)
Khi người dùng yêu cầu xuất file Markdown chứa biểu đồ Mermaid sang Word (`.docx`), **tuyệt đối KHÔNG dùng lệnh pandoc trực tiếp**.
Bắt buộc phải sử dụng script tại `scripts/export_docx.js`:
* Tự động trích xuất block `mermaid` và biên dịch bằng `@mermaid-js/mermaid-cli` với nền trắng (`-b white`).
* Dọn dẹp toàn bộ file ảnh tạm trong thư mục `.tmp_pandoc` sau khi hoàn thành.

**Lệnh thực thi:**
```bash
node scripts/export_docx.js docs/architecture/DYNAMIC_REPORT_ENGINE.md
```

---

## 6. Pre-Commit Local Verification Rule
Trước khi hoàn thành một task có thay đổi mã nguồn, bắt buộc phải chạy script kiểm tra:
```bash
./scripts/local_ci.sh
```
Đảm bảo toàn bộ Unit Tests, TypeScript và ESLint đều đạt kết quả pass 100%.
