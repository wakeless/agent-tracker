import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
/**
 * Detect language from file extension
 */
function getLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        java: 'java',
        kt: 'kotlin',
        swift: 'swift',
        c: 'c',
        cpp: 'cpp',
        h: 'c',
        hpp: 'cpp',
        cs: 'csharp',
        php: 'php',
        sh: 'bash',
        bash: 'bash',
        zsh: 'zsh',
        fish: 'fish',
        json: 'json',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        xml: 'xml',
        html: 'html',
        css: 'css',
        scss: 'scss',
        less: 'less',
        md: 'markdown',
        sql: 'sql',
        graphql: 'graphql',
        dockerfile: 'dockerfile',
    };
    return languageMap[ext || ''] || ext || 'text';
}
/**
 * Detail view for Write tool showing full file content
 */
export function WriteDetailView({ writeInput }) {
    const { file_path, content } = writeInput;
    // Calculate stats
    const lines = content.split('\n');
    const lineCount = lines.length;
    const charCount = content.length;
    const language = getLanguageFromPath(file_path);
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" },
                "Write: ",
                file_path),
            React.createElement(Text, { dimColor: true },
                " (",
                lineCount,
                " lines, ",
                charCount,
                " chars)")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(CodeViewer, { code: content, language: language, showLineNumbers: true })),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "ESC: back to transcript"))));
}
//# sourceMappingURL=WriteDetailView.js.map