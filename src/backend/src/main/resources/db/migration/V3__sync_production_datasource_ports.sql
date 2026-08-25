-- ====================================================================
-- V3: ĐỒNG BỘ CỔNG POSTGRESQL CHUẨN (5432) CHO PRODUCTION
-- ====================================================================

UPDATE RPT_DATASOURCES
SET JDBC_URL = REPLACE(JDBC_URL, ':5433/', ':5432/')
WHERE DB_TYPE = 'POSTGRESQL' AND JDBC_URL LIKE '%:5433/%';
