import React from 'react';
import { Box, Text } from 'ink';
/**
 * Parse a markdown table into rows and columns.
 */
function parseTable(lines) {
    if (lines.length < 2)
        return null;
    // Check if first line looks like a table header
    const headerLine = lines[0];
    if (!headerLine.includes('|'))
        return null;
    // Check if second line is a separator (|---|---|)
    const separatorLine = lines[1];
    if (!separatorLine.match(/^\|?[\s-:|]+\|?$/))
        return null;
    const parseRow = (line) => {
        return line
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell, index, arr) => {
            // Filter out empty first/last cells from leading/trailing |
            if (index === 0 && cell === '')
                return false;
            if (index === arr.length - 1 && cell === '')
                return false;
            return true;
        });
    };
    const headers = parseRow(headerLine);
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
        if (!lines[i].includes('|'))
            break;
        rows.push(parseRow(lines[i]));
    }
    return { headers, rows };
}
/**
 * Render a table with proper formatting.
 */
function renderTable(headers, rows, key) {
    // Calculate column widths
    const colWidths = headers.map((h, i) => {
        const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
        return Math.max(h.length, maxRowWidth, 3);
    });
    const renderRow = (cells, isHeader, rowKey) => (React.createElement(Box, { key: rowKey },
        React.createElement(Text, { dimColor: true }, "\u2502 "),
        cells.map((cell, i) => (React.createElement(React.Fragment, { key: i },
            React.createElement(Text, { bold: isHeader }, cell.padEnd(colWidths[i])),
            React.createElement(Text, { dimColor: true }, " \u2502 "))))));
    const separator = '─'.repeat(colWidths.reduce((a, b) => a + b + 3, 1));
    return (React.createElement(Box, { key: key, flexDirection: "column", marginY: 1 },
        React.createElement(Text, { dimColor: true },
            "\u250C",
            separator,
            "\u2510"),
        renderRow(headers, true, 'header'),
        React.createElement(Text, { dimColor: true },
            "\u251C",
            separator.replace(/─/g, '─'),
            "\u2524"),
        rows.map((row, i) => renderRow(row, false, `row-${i}`)),
        React.createElement(Text, { dimColor: true },
            "\u2514",
            separator,
            "\u2518")));
}
/**
 * Renders content with basic formatting for code blocks and tables.
 */
function renderContent(content) {
    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeLines = [];
    let key = 0;
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Check for code block start/end
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block - render it
                elements.push(React.createElement(Box, { key: key++, flexDirection: "column", marginY: 1 },
                    React.createElement(Text, { dimColor: true },
                        "\u250C\u2500 ",
                        codeBlockLanguage || 'code',
                        " \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"),
                    codeLines.map((codeLine, idx) => (React.createElement(Box, { key: idx },
                        React.createElement(Text, { dimColor: true }, "\u2502 "),
                        React.createElement(Text, { wrap: "truncate-end" }, codeLine)))),
                    React.createElement(Text, { dimColor: true }, "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")));
                inCodeBlock = false;
                codeLines = [];
                codeBlockLanguage = '';
            }
            else {
                // Start of code block
                inCodeBlock = true;
                codeBlockLanguage = line.slice(3).trim();
            }
            i++;
        }
        else if (inCodeBlock) {
            codeLines.push(line);
            i++;
        }
        else if (line.includes('|') && lines[i + 1]?.match(/^\|?[\s-:|]+\|?$/)) {
            // Possible table - collect table lines
            const tableLines = [];
            let j = i;
            while (j < lines.length && (lines[j].includes('|') || lines[j].match(/^\|?[\s-:|]+\|?$/))) {
                tableLines.push(lines[j]);
                j++;
            }
            const table = parseTable(tableLines);
            if (table) {
                elements.push(renderTable(table.headers, table.rows, key++));
                i = j;
            }
            else {
                // Not a valid table, render as regular line
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, { wrap: "wrap" }, line)));
                i++;
            }
        }
        else {
            // Regular line - apply basic formatting
            // Heading (### etc within section)
            if (line.match(/^#{1,6}\s/)) {
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, { bold: true, wrap: "wrap" }, line.replace(/^#+\s*/, ''))));
            }
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                // Bullet point
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, { wrap: "wrap" },
                        "  \u2022 ",
                        line.slice(2))));
            }
            else if (/^\d+\.\s/.test(line)) {
                // Numbered list
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, { wrap: "wrap" },
                        "  ",
                        line)));
            }
            else if (line.trim() === '') {
                // Empty line
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, null, " ")));
            }
            else {
                // Regular text
                elements.push(React.createElement(Box, { key: key++ },
                    React.createElement(Text, { wrap: "wrap" }, line)));
            }
            i++;
        }
    }
    return React.createElement(React.Fragment, null, elements);
}
/**
 * Displays a single plan section with collapse/expand support.
 */
export function PlanSection({ section, index, totalSections, isSelected, isExpanded, }) {
    const indicator = isExpanded ? 'v' : '>';
    const positionLabel = `[${index + 1}/${totalSections}]`;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            isSelected ? (React.createElement(Text, { color: "cyan", bold: true },
                indicator,
                " ",
                section.title)) : (React.createElement(Text, null,
                React.createElement(Text, { dimColor: true },
                    indicator,
                    " "),
                section.title)),
            React.createElement(Text, { dimColor: true },
                '  ',
                positionLabel)),
        isExpanded && (React.createElement(Box, { flexDirection: "column", marginLeft: 2, marginTop: 1 }, renderContent(section.content)))));
}
//# sourceMappingURL=PlanSection.js.map