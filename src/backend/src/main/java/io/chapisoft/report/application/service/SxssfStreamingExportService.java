package io.chapisoft.report.application.service;

import io.chapisoft.report.adapter.out.persistence.ExportTaskRepository;
import io.chapisoft.report.application.dto.ExportRequest;
import io.chapisoft.report.application.dto.ExportTaskDto;
import io.chapisoft.report.domain.exception.ReportEngineException;
import io.chapisoft.report.domain.model.ExportTask;
import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TaskStatus;
import io.chapisoft.report.domain.security.BoundSql;
import io.chapisoft.report.domain.security.DynamicParameterBinder;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSetMetaData;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class SxssfStreamingExportService {

    private final DynamicDataSourceManager dataSourceManager;
    private final ExportTaskRepository exportTaskRepository;
    private final SqlSecurityAstValidator sqlSecurityAstValidator;
    private final DynamicParameterBinder parameterBinder;
    private final QueryExecutionService queryExecutionService;
    private final String storageDir;
    private final int streamingWindowSize;

    public SxssfStreamingExportService(
            DynamicDataSourceManager dataSourceManager,
            ExportTaskRepository exportTaskRepository,
            SqlSecurityAstValidator sqlSecurityAstValidator,
            DynamicParameterBinder parameterBinder,
            QueryExecutionService queryExecutionService,
            @Value("${report.export.storage-dir:./temp_exports}") String storageDir,
            @Value("${report.export.streaming-window-size:500}") int streamingWindowSize) {
        this.dataSourceManager = dataSourceManager;
        this.exportTaskRepository = exportTaskRepository;
        this.sqlSecurityAstValidator = sqlSecurityAstValidator;
        this.parameterBinder = parameterBinder;
        this.queryExecutionService = queryExecutionService;
        this.storageDir = storageDir;
        this.streamingWindowSize = streamingWindowSize;

        File dir = new File(storageDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public ExportTaskDto exportToExcel(String tenantId, String createdBy, ExportRequest request) {
        String taskCode = ReportConstants.PREFIX_TASK_CODE + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String baseName = request.getFileName() != null ? request.getFileName() : ReportConstants.DEFAULT_FILE_NAME_PREFIX + taskCode;
        String fileName = baseName + ReportConstants.EXTENSION_EXCEL;
        File targetFile = new File(storageDir, taskCode + "_" + fileName);

        ExportTask task = ExportTask.builder()
                .taskCode(taskCode)
                .tenantId(tenantId)
                .templateId(request.getTemplateId())
                .fileName(fileName)
                .filePath(targetFile.getAbsolutePath())
                .status(TaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(ReportConstants.DEFAULT_EXPORT_EXPIRATION_HOURS, ChronoUnit.HOURS))
                .createdBy(createdBy != null ? createdBy : ReportConstants.CREATED_BY_SYSTEM)
                .build();

        exportTaskRepository.save(task);

        try {
            String rawSql = resolveSql(request);
            sqlSecurityAstValidator.validateSafeSql(rawSql);
            BoundSql boundSql = parameterBinder.bind(rawSql, request.getParams());

            NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId, request.getDatasourceCode());
            AtomicInteger rowCount = new AtomicInteger(0);

            try (SXSSFWorkbook workbook = new SXSSFWorkbook(streamingWindowSize);
                 FileOutputStream fos = new FileOutputStream(targetFile)) {

                workbook.setCompressTempFiles(true);
                Sheet sheet = workbook.createSheet(ReportConstants.DEFAULT_SHEET_NAME);

                jdbcTemplate.query(
                        Objects.requireNonNull(boundSql.sql()),
                        Objects.requireNonNull(boundSql.parameterSource()),
                        rs -> {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int colCount = metaData.getColumnCount();

                    // Header Row
                    Row headerRow = sheet.createRow(0);
                    for (int i = 1; i <= colCount; i++) {
                        Cell cell = headerRow.createCell(i - 1);
                        cell.setCellValue(metaData.getColumnLabel(i));
                    }

                    // Data Rows
                    while (rs.next()) {
                        int rIdx = rowCount.incrementAndGet();
                        Row row = sheet.createRow(rIdx);
                        for (int i = 1; i <= colCount; i++) {
                            Cell cell = row.createCell(i - 1);
                            Object val = rs.getObject(i);
                            if (val instanceof Number num) {
                                cell.setCellValue(num.doubleValue());
                            } else if (val != null) {
                                cell.setCellValue(val.toString());
                            }
                        }
                    }
                    return null;
                });

                workbook.write(fos);
                workbook.dispose(); // Dọn dẹp file tạm trên ổ đĩa
            }

            long fileSizeBytes = targetFile.length();
            exportTaskRepository.updateStatus(taskCode, TaskStatus.READY, fileSizeBytes, rowCount.get());

            return ExportTaskDto.builder()
                    .taskCode(taskCode)
                    .tenantId(tenantId)
                    .fileName(fileName)
                    .filePath(targetFile.getAbsolutePath())
                    .fileSizeBytes(fileSizeBytes)
                    .rowCount(rowCount.get())
                    .status(TaskStatus.READY)
                    .createdAt(task.getCreatedAt())
                    .expiresAt(task.getExpiresAt())
                    .createdBy(task.getCreatedBy())
                    .downloadUrl("/api/v1/reports/export/download/" + taskCode)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel SXSSF: {}", e.getMessage(), e);
            exportTaskRepository.updateStatus(taskCode, TaskStatus.FAILED, 0L, 0);
            throw new ReportEngineException("Xuất file báo cáo thất bại: " + e.getMessage(), e);
        }
    }

    public ExportTaskDto exportToCsv(String tenantId, String createdBy, ExportRequest request) {
        String taskCode = ReportConstants.PREFIX_TASK_CODE + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String baseName = request.getFileName() != null ? request.getFileName() : ReportConstants.DEFAULT_FILE_NAME_PREFIX + taskCode;
        String fileName = baseName + ReportConstants.EXTENSION_CSV;
        File targetFile = new File(storageDir, taskCode + "_" + fileName);

        ExportTask task = ExportTask.builder()
                .taskCode(taskCode)
                .tenantId(tenantId)
                .templateId(request.getTemplateId())
                .fileName(fileName)
                .filePath(targetFile.getAbsolutePath())
                .status(TaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(ReportConstants.DEFAULT_EXPORT_EXPIRATION_HOURS, ChronoUnit.HOURS))
                .createdBy(createdBy != null ? createdBy : ReportConstants.CREATED_BY_SYSTEM)
                .build();

        exportTaskRepository.save(task);

        try {
            String rawSql = resolveSql(request);
            sqlSecurityAstValidator.validateSafeSql(rawSql);
            BoundSql boundSql = parameterBinder.bind(rawSql, request.getParams());

            NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId, request.getDatasourceCode());
            AtomicInteger rowCount = new AtomicInteger(0);

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(targetFile, StandardCharsets.UTF_8))) {
                // Thêm UTF-8 BOM để Excel mở CSV tiếng Việt không bị lỗi font
                writer.write(ReportConstants.UTF8_BOM);

                jdbcTemplate.query(
                        Objects.requireNonNull(boundSql.sql()),
                        Objects.requireNonNull(boundSql.parameterSource()),
                        rs -> {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int colCount = metaData.getColumnCount();

                    // Header Row
                    StringBuilder header = new StringBuilder();
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) header.append(",");
                        header.append(escapeCsv(metaData.getColumnLabel(i)));
                    }
                    header.append("\n");
                    try {
                        writer.write(header.toString());
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }

                    // Data Rows
                    while (rs.next()) {
                        rowCount.incrementAndGet();
                        StringBuilder row = new StringBuilder();
                        for (int i = 1; i <= colCount; i++) {
                            if (i > 1) row.append(",");
                            Object val = rs.getObject(i);
                            row.append(escapeCsv(val != null ? val.toString() : ""));
                        }
                        row.append("\n");
                        try {
                            writer.write(row.toString());
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return null;
                });
            }

            long fileSizeBytes = targetFile.length();
            exportTaskRepository.updateStatus(taskCode, TaskStatus.READY, fileSizeBytes, rowCount.get());

            return ExportTaskDto.builder()
                    .taskCode(taskCode)
                    .tenantId(tenantId)
                    .fileName(fileName)
                    .filePath(targetFile.getAbsolutePath())
                    .fileSizeBytes(fileSizeBytes)
                    .rowCount(rowCount.get())
                    .status(TaskStatus.READY)
                    .createdAt(task.getCreatedAt())
                    .expiresAt(task.getExpiresAt())
                    .createdBy(task.getCreatedBy())
                    .downloadUrl("/api/v1/reports/export/download/" + taskCode)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi xuất file CSV: {}", e.getMessage(), e);
            exportTaskRepository.updateStatus(taskCode, TaskStatus.FAILED, 0L, 0);
            throw new ReportEngineException("Xuất file CSV thất bại: " + e.getMessage(), e);
        }
    }

    private String resolveSql(ExportRequest request) {
        if (request.getMode() == QueryMode.SQL && request.getSql() != null && !request.getSql().trim().isEmpty()) {
            return request.getSql();
        }
        if (request.getConfigJson() != null && !request.getConfigJson().trim().isEmpty()) {
            return queryExecutionService.generateSqlFromGuiConfig(request.getConfigJson());
        }
        throw new ReportEngineException("Không tìm thấy câu lệnh SQL để xuất dữ liệu.");
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
