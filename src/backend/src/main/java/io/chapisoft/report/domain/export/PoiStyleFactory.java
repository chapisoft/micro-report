package io.chapisoft.report.domain.export;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;

public class PoiStyleFactory {

    private final CellStyle headerStyle;
    private final CellStyle textStyle;
    private final CellStyle numberStyle;
    private final CellStyle currencyStyle;
    private final CellStyle dateStyle;
    private final CellStyle totalHeaderStyle;
    private final CellStyle totalNumberStyle;
    private final CellStyle totalCurrencyStyle;

    public PoiStyleFactory(Workbook workbook) {
        DataFormat dataFormat = workbook.createDataFormat();

        // 1. Header Font & Style
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 11);
        headerFont.setFontName("Calibri");
        headerFont.setColor(IndexedColors.WHITE.getIndex());

        this.headerStyle = workbook.createCellStyle();
        this.headerStyle.setFont(headerFont);
        this.headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        this.headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.headerStyle.setAlignment(HorizontalAlignment.CENTER);
        this.headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.headerStyle, BorderStyle.THIN, IndexedColors.GREY_40_PERCENT.getIndex());

        // 2. Base Fonts for Data
        Font normalFont = workbook.createFont();
        normalFont.setFontHeightInPoints((short) 10);
        normalFont.setFontName("Calibri");

        Font boldFont = workbook.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 10);
        boldFont.setFontName("Calibri");

        // 3. Text Style
        this.textStyle = workbook.createCellStyle();
        this.textStyle.setFont(normalFont);
        this.textStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.textStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());

        // 4. Number Style
        this.numberStyle = workbook.createCellStyle();
        this.numberStyle.setFont(normalFont);
        this.numberStyle.setDataFormat(dataFormat.getFormat("#,##0"));
        this.numberStyle.setAlignment(HorizontalAlignment.RIGHT);
        this.numberStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.numberStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());

        // 5. Currency Style (VNĐ)
        this.currencyStyle = workbook.createCellStyle();
        this.currencyStyle.setFont(normalFont);
        this.currencyStyle.setDataFormat(dataFormat.getFormat("#,##0 \"₫\""));
        this.currencyStyle.setAlignment(HorizontalAlignment.RIGHT);
        this.currencyStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.currencyStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());

        // 6. Date Style
        this.dateStyle = workbook.createCellStyle();
        this.dateStyle.setFont(normalFont);
        this.dateStyle.setDataFormat(dataFormat.getFormat("yyyy-mm-dd hh:mm:ss"));
        this.dateStyle.setAlignment(HorizontalAlignment.CENTER);
        this.dateStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(this.dateStyle, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());

        // 7. Grand Total Row Styles
        this.totalHeaderStyle = workbook.createCellStyle();
        this.totalHeaderStyle.setFont(boldFont);
        this.totalHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        this.totalHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.totalHeaderStyle.setAlignment(HorizontalAlignment.LEFT);
        this.totalHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyTotalBorders(this.totalHeaderStyle);

        this.totalNumberStyle = workbook.createCellStyle();
        this.totalNumberStyle.setFont(boldFont);
        this.totalNumberStyle.setDataFormat(dataFormat.getFormat("#,##0"));
        this.totalNumberStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        this.totalNumberStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.totalNumberStyle.setAlignment(HorizontalAlignment.RIGHT);
        this.totalNumberStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyTotalBorders(this.totalNumberStyle);

        this.totalCurrencyStyle = workbook.createCellStyle();
        this.totalCurrencyStyle.setFont(boldFont);
        this.totalCurrencyStyle.setDataFormat(dataFormat.getFormat("#,##0 \"₫\""));
        this.totalCurrencyStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        this.totalCurrencyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        this.totalCurrencyStyle.setAlignment(HorizontalAlignment.RIGHT);
        this.totalCurrencyStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        applyTotalBorders(this.totalCurrencyStyle);
    }

    public static void applySheetFeatures(Sheet sheet, int rowCount, int colCount) {
        if (sheet == null) {
            return;
        }
        // Đóng băng dòng tiêu đề Header (Freeze Top Row)
        sheet.createFreezePane(0, 1);

        // Kích hoạt bộ lọc AutoFilter nếu có dữ liệu
        if (rowCount > 0 && colCount > 0) {
            sheet.setAutoFilter(new CellRangeAddress(0, rowCount, 0, colCount - 1));
        }
    }

    public CellStyle getHeaderStyle() {
        return headerStyle;
    }

    public CellStyle getTextStyle() {
        return textStyle;
    }

    public CellStyle getNumberStyle() {
        return numberStyle;
    }

    public CellStyle getCurrencyStyle() {
        return currencyStyle;
    }

    public CellStyle getDateStyle() {
        return dateStyle;
    }

    public CellStyle getTotalHeaderStyle() {
        return totalHeaderStyle;
    }

    public CellStyle getTotalNumberStyle() {
        return totalNumberStyle;
    }

    public CellStyle getTotalCurrencyStyle() {
        return totalCurrencyStyle;
    }

    private void applyBorders(CellStyle style, BorderStyle border, short borderColor) {
        style.setBorderTop(border);
        style.setBorderBottom(border);
        style.setBorderLeft(border);
        style.setBorderRight(border);
        style.setTopBorderColor(borderColor);
        style.setBottomBorderColor(borderColor);
        style.setLeftBorderColor(borderColor);
        style.setRightBorderColor(borderColor);
    }

    private void applyTotalBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.DOUBLE);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }
}
