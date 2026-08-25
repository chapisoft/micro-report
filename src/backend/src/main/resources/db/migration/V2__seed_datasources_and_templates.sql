-- ====================================================================
-- V2: SEED DATA CHO HỆ THỐNG DIP VÀ MICRO-CRM
-- (Cấu hình DataSource, Mẫu báo cáo động, và Lịch sử tác vụ xuất file)
-- ====================================================================

-- 0. DỌN DẸP DỮ LIỆU CŨ NẾU ĐÃ TỒN TẠI (IDEMPOTENT CLEANUP)
DELETE FROM RPT_EXPORT_TASKS WHERE TASK_CODE IN ('TASK_EXP_DIP_INIT_001', 'TASK_EXP_CRM_INIT_001');

DELETE FROM RPT_TEMPLATES WHERE (TENANT_ID, TEMPLATE_CODE) IN (
    ('DIP_BHXH', 'RPT_DIP_DOSSIERS_SUMMARY'),
    ('DIP_BHXH', 'RPT_DIP_COMMISSIONS_AGENT'),
    ('DIP_BHXH', 'RPT_DIP_DAILY_REVENUE'),
    ('MICRO_CRM', 'RPT_CRM_LEADS_BY_SOURCE'),
    ('MICRO_CRM', 'RPT_CRM_SALES_PIPELINE'),
    ('MICRO_CRM', 'RPT_CRM_AGENT_PERFORMANCE')
);

DELETE FROM RPT_DATASOURCES WHERE (TENANT_ID, DATASOURCE_CODE) IN (
    ('DIP_BHXH', 'DIP_DWH'),
    ('DIP_BHXH', 'DIP_ORACLE'),
    ('MICRO_CRM', 'CRM_DWH'),
    ('NATCASH_PAYMENT', 'NATCASH_DWH'),
    ('DEFAULT', 'DEFAULT_DS')
);

-- 1. SEED CẤU HÌNH KẾT NỐI CSDL ĐỘNG (DATASOURCES)
INSERT INTO RPT_DATASOURCES (DATASOURCE_CODE, TENANT_ID, NAME, DB_TYPE, JDBC_URL, USERNAME, PASSWORD_ENCRYPTED, MAX_POOL_SIZE, IS_READ_ONLY, STATUS)
VALUES 
    -- 1.1. Hệ thống DIP Platform (OLAP Data Warehouse qua SSH Tunnel)
    ('DIP_DWH', 'DIP_BHXH', 'DIP OLAP Data Warehouse', 'POSTGRESQL', 'jdbc:postgresql://localhost:5432/dip_olap', 'dip_olap_user', 'gRKJLsnabGpV/WaF+Y+BG/v2oyLqcKT69uJEb4GY12w=', 10, TRUE, 'ACTIVE'),
    
    -- 1.2. Hệ thống DIP Platform (CSDL Nghiệp vụ Oracle qua SSH Tunnel)
    ('DIP_ORACLE', 'DIP_BHXH', 'DIP Core Oracle XE', 'ORACLE', 'jdbc:oracle:thin:@localhost:1521/XEPDB1', 'dip_user', 'YMTgbrmgbPdcKBM0nHZpXw==', 10, TRUE, 'ACTIVE'),

    -- 1.3. Hệ thống Micro-CRM (OLAP CSDL Khách hàng & Bán hàng)
    ('CRM_DWH', 'MICRO_CRM', 'Micro-CRM OLAP Database', 'POSTGRESQL', 'jdbc:postgresql://localhost:5432/crm_olap', 'crm_readonly', '+XjDZd+NJMd9Cjmw3zmIqW1Y6CL1eKicqbjQZbPzecM=', 10, TRUE, 'ACTIVE'),
    
    -- 1.4. Hệ thống Ví Điện Tử Natcash
    ('NATCASH_DWH', 'NATCASH_PAYMENT', 'Natcash Payment OLAP DB', 'POSTGRESQL', 'jdbc:postgresql://localhost:5432/natcash_db', 'natcash_user', 'gRKJLsnabGpV/WaF+Y+BG/v2oyLqcKT69uJEb4GY12w=', 10, TRUE, 'ACTIVE'),
    
    -- 1.5. Môi trường Mặc định / Sandbox
    ('DEFAULT_DS', 'DEFAULT', 'Default Embedded H2 Database', 'H2', 'jdbc:h2:mem:report_meta_db;MODE=PostgreSQL', 'sa', 'vvwJatk83QuwyapTkqo2KA==', 5, TRUE, 'ACTIVE');

-- 2. SEED CÁC MẪU BÁO CÁO ĐỘNG (REPORT TEMPLATES)

-- 2.1. Mẫu Báo Cáo Cho Hệ Thống DIP Platform
INSERT INTO RPT_TEMPLATES (TEMPLATE_CODE, TENANT_ID, DATASOURCE_CODE, TEMPLATE_NAME, MODE, STATUS, IS_PUBLIC, IS_SYSTEM, CONFIG_JSON, TRANSFORM_JS, CREATED_BY)
VALUES
    (
        'RPT_DIP_DOSSIERS_SUMMARY',
        'DIP_BHXH',
        'DIP_DWH',
        'Báo Cáo Tổng Hợp Hồ Sơ Thu Hộ BHXH/BHYT',
        'SQL',
        'ACTIVE',
        TRUE,
        TRUE,
        'SELECT dossier_type, COUNT(*) AS total_count, SUM(total_amount) AS total_revenue, MIN(created_at) AS first_date, MAX(created_at) AS last_date FROM fact_dossiers WHERE (:status IS NULL OR status = :status) GROUP BY dossier_type ORDER BY total_revenue DESC',
        '// Báo cáo tổng hợp số lượng và doanh thu theo loại hồ sơ',
        'SYSTEM'
    ),
    (
        'RPT_DIP_COMMISSIONS_AGENT',
        'DIP_BHXH',
        'DIP_DWH',
        'Báo Cáo Đối Soát Hoa Hồng Đại Lý Thu Hộ',
        'SQL',
        'ACTIVE',
        TRUE,
        TRUE,
        'SELECT c.agent_user_id, COUNT(c.commission_id) AS total_txns, SUM(c.commission_amount) AS total_commission, AVG(c.commission_rate) AS avg_rate FROM fact_commissions c WHERE (:agent_id IS NULL OR c.agent_user_id = :agent_id) GROUP BY c.agent_user_id ORDER BY total_commission DESC',
        '// Báo cáo chi trả và đối soát hoa hồng cho từng đại lý',
        'SYSTEM'
    ),
    (
        'RPT_DIP_DAILY_REVENUE',
        'DIP_BHXH',
        'DIP_DWH',
        'Báo Cáo Doanh Thu Thu Hộ Theo Ngày (Visual Builder)',
        'GUI',
        'ACTIVE',
        TRUE,
        FALSE,
        '{"primaryTable":"fact_dossiers","columns":[{"id":"c1","tableName":"fact_dossiers","columnName":"created_at","alias":"ngay_giao_dich","aggregation":"NONE"},{"id":"c2","tableName":"fact_dossiers","columnName":"total_amount","alias":"doanh_thu","aggregation":"SUM"},{"id":"c3","tableName":"fact_dossiers","columnName":"dossier_id","alias":"so_luong","aggregation":"COUNT"}],"joins":[],"filters":[],"groupBy":["fact_dossiers.created_at"],"orderBy":[{"column":"fact_dossiers.created_at","direction":"DESC"}],"limit":50}',
        '// Báo cáo xây dựng bằng giao diện No-Code kéo thả',
        'SYSTEM'
    );

-- 2.2. Mẫu Báo Cáo Cho Hệ Thống MICRO-CRM
INSERT INTO RPT_TEMPLATES (TEMPLATE_CODE, TENANT_ID, DATASOURCE_CODE, TEMPLATE_NAME, MODE, STATUS, IS_PUBLIC, IS_SYSTEM, CONFIG_JSON, TRANSFORM_JS, CREATED_BY)
VALUES
    (
        'RPT_CRM_LEADS_BY_SOURCE',
        'MICRO_CRM',
        'CRM_DWH',
        'Báo Cáo Khách Hàng Tiềm Năng (Leads) Theo Nguồn',
        'SQL',
        'ACTIVE',
        TRUE,
        TRUE,
        'SELECT source, COUNT(*) AS total_leads, SUM(CASE WHEN status = ''CONVERTED'' THEN 1 ELSE 0 END) AS converted_leads, ROUND(SUM(CASE WHEN status = ''CONVERTED'' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS conversion_rate FROM crm_leads GROUP BY source ORDER BY total_leads DESC',
        '// Phân tích tỷ lệ chuyển đổi Leads thành Khách hàng chính thức',
        'SYSTEM'
    ),
    (
        'RPT_CRM_SALES_PIPELINE',
        'MICRO_CRM',
        'CRM_DWH',
        'Báo Cáo Phễu Bán Hàng & Cơ Hội (Sales Deals Pipeline)',
        'SQL',
        'ACTIVE',
        TRUE,
        TRUE,
        'SELECT stage, COUNT(*) AS total_deals, SUM(expected_revenue) AS pipeline_value, SUM(actual_revenue) AS closed_revenue FROM crm_deals GROUP BY stage ORDER BY pipeline_value DESC',
        '// Theo dõi giá trị cơ hội bán hàng theo từng giai đoạn phễu',
        'SYSTEM'
    ),
    (
        'RPT_CRM_AGENT_PERFORMANCE',
        'MICRO_CRM',
        'CRM_DWH',
        'Báo Cáo Hiệu Suất Nhân Viên Kinh Doanh (Visual GUI)',
        'GUI',
        'ACTIVE',
        TRUE,
        FALSE,
        '{"primaryTable":"crm_activities","columns":[{"id":"c1","tableName":"crm_activities","columnName":"agent_name","alias":"nhan_vien","aggregation":"NONE"},{"id":"c2","tableName":"crm_activities","columnName":"call_count","alias":"tong_cuoc_goi","aggregation":"SUM"},{"id":"c3","tableName":"crm_activities","columnName":"deal_closed","alias":"hop_dong_ky","aggregation":"SUM"}],"joins":[],"filters":[],"groupBy":["crm_activities.agent_name"],"orderBy":[{"column":"crm_activities.agent_name","direction":"ASC"}],"limit":50}',
        '// Đo lường KPI cuộc gọi và hợp đồng ký kết của Sales',
        'SYSTEM'
    );

-- 3. SEED LỊCH SỬ TÁC VỤ XUẤT FILE MẪU (AUDIT EXPORT TASKS)
INSERT INTO RPT_EXPORT_TASKS (TASK_CODE, TENANT_ID, FILE_NAME, FILE_PATH, FILE_SIZE_BYTES, ROW_COUNT, STATUS, CREATED_AT, EXPIRES_AT, CREATED_BY)
VALUES 
    (
        'TASK_EXP_DIP_INIT_001',
        'DIP_BHXH',
        'Bao_Cao_Ho_So_BHXH_20260821.xlsx',
        '/tmp/report_exports/Bao_Cao_Ho_So_BHXH_20260821.xlsx',
        45280,
        1520,
        'READY',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'admin_dip'
    ),
    (
        'TASK_EXP_CRM_INIT_001',
        'MICRO_CRM',
        'Bao_Cao_Leads_CRM_20260821.xlsx',
        '/tmp/report_exports/Bao_Cao_Leads_CRM_20260821.xlsx',
        38120,
        980,
        'READY',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'admin_crm'
    );
