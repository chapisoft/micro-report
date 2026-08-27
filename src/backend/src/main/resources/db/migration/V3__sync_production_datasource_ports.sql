-- ====================================================================
-- V3: ĐỒNG BỘ CỔNG POSTGRESQL CHUẨN CHO PRODUCTION
-- ====================================================================

-- 1. DIP OLAP Postgres (db_stack_postgres trên cổng 5432)
UPDATE RPT_DATASOURCES
SET JDBC_URL = REPLACE(JDBC_URL, ':5433/', ':5432/')
WHERE DATASOURCE_CODE IN ('DIP_DWH', 'NATCASH_DWH') AND JDBC_URL LIKE '%:5433/%';

-- 2. CRM OLAP Postgres (crm-postgres-olap trên cổng 15432)
UPDATE RPT_DATASOURCES
SET JDBC_URL = REPLACE(JDBC_URL, ':5433/', ':15432/')
WHERE DATASOURCE_CODE = 'CRM_DWH' AND JDBC_URL LIKE '%:5433/%';

