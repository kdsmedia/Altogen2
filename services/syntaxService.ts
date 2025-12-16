// Simple regex-based syntax highlighter for HTML, JS, CSS
// Returns HTML string with color classes
import { EditorIssue } from '../types';

export const highlightCode = (code: string, fileName: string): string => {
    // Escape HTML first to prevent injection
    let safeCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const ext = fileName.split('.').pop()?.toLowerCase();

    // COLOR PALETTE CLASSES (using inline styles for now as we inject into pre)
    const CLS = {
        KEYWORD: 'color: #22d3ee; font-weight: bold;', // Cyan (Blue-ish)
        ATTR: 'color: #facc15;', // Yellow
        STRING: 'color: #4ade80;', // Green
        TAG: 'color: #38bdf8;', // Sky Blue
        COMMENT: 'color: #64748b; font-style: italic;', // Slate
        NUMBER: 'color: #f97316;', // Orange
        ERROR: 'color: #ef4444; text-decoration: underline wavy #ef4444; font-weight: bold;', // Red
        DEFAULT: 'color: #e2e8f0;' // White/Slate-200
    };

    const wrap = (str: string, style: string) => `<span style="${style}">${str}</span>`;

    if (ext === 'html' || ext === 'xml') {
        // HTML Highlighting
        return safeCode
            // Comments
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, wrap('$1', CLS.COMMENT))
            // Tags (start)
            .replace(/(&lt;\/?)(\w+)(?![^&]*&gt;)/g, (match, p1, p2) => {
                return wrap(p1, CLS.TAG) + wrap(p2, CLS.TAG);
            })
            // Attributes
            .replace(/(\s)([a-zA-Z-]+)(=)/g, (match, space, attr, eq) => {
                return space + wrap(attr, CLS.ATTR) + wrap(eq, CLS.DEFAULT);
            })
            // Strings
            .replace(/(".*?")|('.*?')/g, wrap('$0', CLS.STRING))
            // Tag End
            .replace(/(\/?&gt;)/g, wrap('$1', CLS.TAG));

    } else if (ext === 'js' || ext === 'json' || ext === 'ts') {
        // JS Highlighting
        const keywords = /\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|class|new|try|catch|true|false|null|undefined)\b/g;
        
        return safeCode
            // Comments // or /* */
            .replace(/(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g, wrap('$0', CLS.COMMENT))
            // Keywords
            .replace(keywords, wrap('$0', CLS.KEYWORD))
            // Functions definition
            .replace(/(\w+)(?=\()/g, wrap('$0', CLS.ATTR)) // Yellow for functions
            // Strings
            .replace(/(".*?")|('.*?')|(`[\s\S]*?`)/g, wrap('$0', CLS.STRING))
            // Numbers
            .replace(/\b(\d+)\b/g, wrap('$0', CLS.NUMBER))
            // Brackets/Ops
            .replace(/({|}|\[|\]|\(|\))/g, wrap('$0', CLS.DEFAULT));
    } else if (ext === 'css') {
        return safeCode
            // Comments
            .replace(/(\/\*[\s\S]*?\*\/)/g, wrap('$0', CLS.COMMENT))
            // Selectors (start of line or after })
            .replace(/(^|}|{)\s*([^{]+)(?={)/g, (m, pre, sel) => {
                return pre + wrap(sel, CLS.KEYWORD);
            })
            // Properties
            .replace(/([a-zA-Z-]+)(:)/g, wrap('$1', CLS.ATTR) + '$2')
            // Values
            .replace(/:(.+?)(;)/g, ':' + wrap('$1', CLS.STRING) + '$2');
    }

    return safeCode;
};

// ANALYZE CODE FOR ERRORS (LINTING)
export const analyzeCode = (code: string, fileName: string): EditorIssue[] => {
    const issues: EditorIssue[] = [];
    const lines = code.split('\n');
    const ext = fileName.split('.').pop()?.toLowerCase();

    lines.forEach((line, i) => {
        const lineNum = i + 1;
        const trimmed = line.trim();

        // --- HTML CHECKS ---
        if (ext === 'html') {
            // Check 1: Mixed Content (HTTP) - Critical Error
            if (trimmed.includes('src="http://') || trimmed.includes('href="http://')) {
                issues.push({
                    id: `html-http-${lineNum}`,
                    line: lineNum,
                    severity: 'error',
                    message: 'Mixed Content: Using "http://" is insecure and will be blocked by Cordova.',
                    snippet: trimmed,
                    fixSuggestion: line.replace('http://', 'https://')
                });
            }

            // Check 2: Missing Alt on Images - Warning
            if (trimmed.includes('<img') && !trimmed.includes('alt=')) {
                issues.push({
                    id: `html-alt-${lineNum}`,
                    line: lineNum,
                    severity: 'warning',
                    message: 'Accessibility: <img> tag is missing "alt" attribute.',
                    snippet: trimmed,
                    fixSuggestion: line.replace('<img', '<img alt="image"')
                });
            }
        }

        // --- JS CHECKS ---
        if (ext === 'js' || ext === 'ts') {
            // Check 1: Use of 'var' - Warning
            if (trimmed.startsWith('var ')) {
                issues.push({
                    id: `js-var-${lineNum}`,
                    line: lineNum,
                    severity: 'warning',
                    message: 'Modern JS: Prefer "const" or "let" over "var".',
                    snippet: trimmed,
                    fixSuggestion: line.replace('var ', 'let ')
                });
            }

            // Check 2: Use of '==' - Warning
            if (trimmed.includes(' == ') && !trimmed.includes('===')) {
                issues.push({
                    id: `js-eq-${lineNum}`,
                    line: lineNum,
                    severity: 'warning',
                    message: 'Equality: Use strict equality "===" to avoid type coercion bugs.',
                    snippet: trimmed,
                    fixSuggestion: line.replace(' == ', ' === ')
                });
            }

            // Check 3: Console Log - Info
            if (trimmed.includes('console.log')) {
                issues.push({
                    id: `js-console-${lineNum}`,
                    line: lineNum,
                    severity: 'info',
                    message: 'Optimization: Remove console.log in production code.',
                    snippet: trimmed,
                    // Fix: comment it out
                    fixSuggestion: line.replace('console.log', '// console.log')
                });
            }
            
            // Check 4: Empty Block - Warning
            if (trimmed.includes('{}') && !trimmed.includes('=')) {
                 issues.push({
                    id: `js-empty-${lineNum}`,
                    line: lineNum,
                    severity: 'warning',
                    message: 'Code Quality: Empty block detected.',
                    snippet: trimmed
                });
            }
        }
    });

    return issues;
};

// Helper to apply a fix to the full content string
export const applyLintFix = (code: string, issue: EditorIssue): string => {
    if (!issue.fixSuggestion) return code;
    
    const lines = code.split('\n');
    const index = issue.line - 1;
    
    if (index >= 0 && index < lines.length) {
        lines[index] = issue.fixSuggestion;
        return lines.join('\n');
    }
    return code;
};