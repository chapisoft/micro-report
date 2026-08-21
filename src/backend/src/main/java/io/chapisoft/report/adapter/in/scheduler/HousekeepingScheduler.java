package io.chapisoft.report.adapter.in.scheduler;

import io.chapisoft.report.adapter.out.persistence.ExportTaskRepository;
import io.chapisoft.report.adapter.out.persistence.ReportTemplateRepository;
import io.chapisoft.report.domain.model.ExportTask;

import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
public class HousekeepingScheduler {

    private final ExportTaskRepository exportTaskRepository;
    private final ReportTemplateRepository reportTemplateRepository;
    private final int templateFreezeDays;

    public HousekeepingScheduler(
            ExportTaskRepository exportTaskRepository,
            ReportTemplateRepository reportTemplateRepository,
            @Value("${report.housekeeping.template-freeze-days:90}") int templateFreezeDays) {
        this.exportTaskRepository = exportTaskRepository;
        this.reportTemplateRepository = reportTemplateRepository;
        this.templateFreezeDays = templateFreezeDays;
    }

    /**
     * Tầng 1: Dọn dẹp các file xuất báo cáo tạm thời hết hạn sau 24H (chạy lúc 01:00 AM hàng ngày).
     */
    @Scheduled(cron = "${report.housekeeping.cron-temp-cleanup:0 0 1 * * *}")
    @SchedulerLock(name = "ReportEngine_CleanupExpiredTempFiles", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void cleanupExpiredExportFiles() {
        log.info("Bắt đầu tiến trình Housekeeping: Quét và xóa file xuất báo cáo tạm đã hết hạn (> 24h)...");
        Instant now = Instant.now();
        List<ExportTask> expiredTasks = exportTaskRepository.findExpiredTasks(now);

        int deletedCount = 0;
        for (ExportTask task : expiredTasks) {
            try {
                if (task.getFilePath() != null) {
                    File file = new File(task.getFilePath());
                    if (file.exists() && file.delete()) {
                        log.debug("Đã xóa file tạm: {}", task.getFilePath());
                    }
                }
                exportTaskRepository.markAsExpired(task.getId());
                deletedCount++;
            } catch (Exception e) {
                log.error("Lỗi khi xóa file tạm task {}: {}", task.getTaskCode(), e.getMessage());
            }
        }
        log.info("Hoàn tất dọn dẹp file tạm. Đã xử lý {} tác vụ hết hạn.", deletedCount);
    }

    /**
     * Tầng 2: Đóng băng/Lưu trữ (ARCHIVE) các mẫu báo cáo không được truy cập quá 90 ngày (chạy lúc 02:00 AM hàng ngày).
     */
    @Scheduled(cron = "${report.housekeeping.cron-template-freeze:0 0 2 * * *}")
    @SchedulerLock(name = "ReportEngine_FreezeInactiveTemplates", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void freezeInactiveReportTemplates() {
        log.info("Bắt đầu tiến trình Housekeeping: Đóng băng các mẫu báo cáo không sử dụng (> {} ngày)...", templateFreezeDays);
        Instant cutoff = Instant.now().minus(templateFreezeDays, ChronoUnit.DAYS);
        int frozenCount = reportTemplateRepository.freezeInactiveTemplates(cutoff);
        log.info("Hoàn tất đóng băng mẫu báo cáo cũ. Đã chuyển {} mẫu sang trạng thái ARCHIVED.", frozenCount);
    }
}
