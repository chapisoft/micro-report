package io.chapisoft.report.adapter.in.scheduler;

import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DwhSyncScheduler {

    /**
     * Đồng bộ bù định kỳ mỗi 60 phút (Lookback 2h).
     */
    @Scheduled(cron = "0 0 * * * *")
    @SchedulerLock(name = "ReportEngine_DwhBatchSync", lockAtLeastFor = "PT2M", lockAtMostFor = "PT15M")
    public void runHourlyBatchSync() {
        log.info("Chạy Batch Sync bù dữ liệu DWH định kỳ 60 phút...");
    }

    /**
     * Đối soát số liệu tổng hợp ban đêm (Nightly Reconcile lúc 00:30 AM).
     */
    @Scheduled(cron = "0 30 0 * * *")
    @SchedulerLock(name = "ReportEngine_DwhNightlyReconcile", lockAtLeastFor = "PT5M", lockAtMostFor = "PT30M")
    public void runNightlyReconcile() {
        log.info("Chạy Nightly Reconcile đối soát toàn diện dữ liệu 24h qua lúc 00:30 AM...");
    }

    /**
     * Làm mới Materialized Views mỗi 15 phút.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @SchedulerLock(name = "ReportEngine_RefreshMaterializedViews", lockAtLeastFor = "PT1M", lockAtMostFor = "PT5M")
    public void refreshMaterializedViews() {
        log.info("Làm mới các Materialized Views tăng tốc độ truy vấn báo cáo...");
    }
}
