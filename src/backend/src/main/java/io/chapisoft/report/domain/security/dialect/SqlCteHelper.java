package io.chapisoft.report.domain.security.dialect;

public final class SqlCteHelper {

    private SqlCteHelper() {
        // Utility class
    }

    public record CteSplitResult(String withClause, String mainQuery) {
        public boolean hasWithClause() {
            return withClause != null && !withClause.trim().isEmpty();
        }
    }

    public static CteSplitResult splitCteAndMainQuery(String sql) {
        if (sql == null) {
            return new CteSplitResult("", "");
        }
        String trimmed = sql.trim();
        if (!trimmed.toUpperCase().startsWith("WITH")) {
            return new CteSplitResult("", trimmed);
        }

        int len = trimmed.length();
        int parenDepth = 0;
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;

        for (int i = 0; i < len; i++) {
            char c = trimmed.charAt(i);
            char next = (i + 1 < len) ? trimmed.charAt(i + 1) : '\0';

            // Handle comments
            if (inLineComment) {
                if (c == '\n' || c == '\r') {
                    inLineComment = false;
                }
                continue;
            }
            if (inBlockComment) {
                if (c == '*' && next == '/') {
                    inBlockComment = false;
                    i++;
                }
                continue;
            }

            // Handle quotes
            if (inSingleQuote) {
                if (c == '\'') {
                    if (next == '\'') {
                        i++; // Escaped quote ''
                    } else {
                        inSingleQuote = false;
                    }
                }
                continue;
            }
            if (inDoubleQuote) {
                if (c == '"') {
                    if (next == '"') {
                        i++; // Escaped double quote ""
                    } else {
                        inDoubleQuote = false;
                    }
                }
                continue;
            }

            if (c == '-' && next == '-') {
                inLineComment = true;
                i++;
                continue;
            }
            if (c == '/' && next == '*') {
                inBlockComment = true;
                i++;
                continue;
            }
            if (c == '\'') {
                inSingleQuote = true;
                continue;
            }
            if (c == '"') {
                inDoubleQuote = true;
                continue;
            }

            // Handle parentheses depth
            if (c == '(') {
                parenDepth++;
            } else if (c == ')') {
                if (parenDepth > 0) {
                    parenDepth--;
                }
            } else if (parenDepth == 0) {
                // When outside any parentheses, look for top-level SELECT keyword
                if (isWordAt(trimmed, i, "SELECT")) {
                    String withPart = trimmed.substring(0, i).trim();
                    String mainPart = trimmed.substring(i).trim();
                    return new CteSplitResult(withPart, mainPart);
                }
            }
        }

        return new CteSplitResult("", trimmed);
    }

    private static boolean isWordAt(String text, int index, String word) {
        int wordLen = word.length();
        if (index + wordLen > text.length()) {
            return false;
        }

        // Must match word case-insensitively
        String sub = text.substring(index, index + wordLen);
        if (!sub.equalsIgnoreCase(word)) {
            return false;
        }

        // Must be preceded by non-alphanumeric (or start)
        if (index > 0) {
            char prev = text.charAt(index - 1);
            if (Character.isLetterOrDigit(prev) || prev == '_') {
                return false;
            }
        }

        // Must be followed by non-alphanumeric (or end)
        if (index + wordLen < text.length()) {
            char next = text.charAt(index + wordLen);
            if (Character.isLetterOrDigit(next) || next == '_') {
                return false;
            }
        }

        return true;
    }
}
