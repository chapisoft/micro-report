package io.chapisoft.report.domain.export;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PoiStyleFactoryTest {

    @Test
    @DisplayName("Khởi tạo và gán đầy đủ các CellStyle chuyên nghiệp (Header, Currency, Grand Total)")
    void testPoiStylesCreation() {
        try (Workbook workbook = new XSSFWorkbook()) {
            PoiStyleFactory factory = new PoiStyleFactory(workbook);

            assertThat(factory.getHeaderStyle()).isNotNull();
            assertThat(factory.getTextStyle()).isNotNull();
            assertThat(factory.getNumberStyle()).isNotNull();
            assertThat(factory.getCurrencyStyle()).isNotNull();
            assertThat(factory.getDateStyle()).isNotNull();
            assertThat(factory.getTotalHeaderStyle()).isNotNull();
            assertThat(factory.getTotalNumberStyle()).isNotNull();
            assertThat(factory.getTotalCurrencyStyle()).isNotNull();

            Sheet sheet = workbook.createSheet("TestSheet");
            Row row = sheet.createRow(0);
            Cell cell = row.createCell(0);
            cell.setCellValue("DOANH_THU");
            cell.setCellStyle(factory.getHeaderStyle());

            PoiStyleFactory.applySheetFeatures(sheet, 10, 5);
            assertThat(sheet.getPaneInformation()).isNotNull();
            assertThat(sheet.getPaneInformation().isFreezePane()).isTrue();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
