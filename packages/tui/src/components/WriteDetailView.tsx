import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
import { WriteInput } from './tools/ToolDisplayProps.js';

export interface WriteDetailViewProps {
  writeInput: WriteInput;
}

/**
 * Detect language from file extension
 */
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
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
export function WriteDetailView({ writeInput }: WriteDetailViewProps) {
  const { file_path, content } = writeInput;

  // Calculate stats
  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;
  const language = getLanguageFromPath(file_path);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box
        borderStyle="single"
        borderColor="cyan"
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          Write: {file_path}
        </Text>
        <Text dimColor> ({lineCount} lines, {charCount} chars)</Text>
      </Box>

      {/* Content */}
      <Box marginBottom={1}>
        <CodeViewer
          code={content}
          language={language}
          showLineNumbers={true}
        />
      </Box>

      {/* Footer with help */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          ESC: back to transcript
        </Text>
      </Box>
    </Box>
  );
}
