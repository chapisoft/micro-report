package io.chapisoft.report.domain.exception;

public class SecurityViolationException extends RuntimeException {

    public SecurityViolationException(String message) {
        super(message);
    }
}
