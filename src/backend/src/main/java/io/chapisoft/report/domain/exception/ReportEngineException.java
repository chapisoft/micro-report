package io.chapisoft.report.domain.exception;

public class ReportEngineException extends RuntimeException {

    public ReportEngineException(String message) {
        super(message);
    }

    public ReportEngineException(String message, Throwable cause) {
        super(message, cause);
    }
}
