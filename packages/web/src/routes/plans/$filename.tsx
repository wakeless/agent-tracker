import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getPlan } from '../../server/plans';

// Type definitions for plan sections (mirroring core package types)
interface CodeBlock {
  language: string;
  code: string;
}

interface PlanSection {
  id: string;
  title: string;
  level: number;
  content: string;
  codeBlocks: CodeBlock[];
}

interface ParsedPlan {
  title: string;
  sections: PlanSection[];
}

export const Route = createFileRoute('/plans/$filename')({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { filename } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['plan', filename],
    queryFn: () => getPlan({ data: filename }),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  const parsedPlan = data?.parsed as ParsedPlan | null;

  if (!data?.content || !parsedPlan) {
    return <NotFoundState filename={filename} />;
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <Link to="/plans" style={{ color: '#a371f7', fontSize: '13px' }}>
          ← Plans
        </Link>
        <span style={{ color: '#a371f7', fontSize: '12px' }}>●</span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9' }}>
          {parsedPlan.title}
        </span>
      </div>

      {/* File info */}
      <div style={{
        padding: '12px 16px',
        marginBottom: '16px',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
        fontSize: '13px',
        color: '#8b949e',
      }}>
        <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>
          {filename}
        </code>
        <span style={{ marginLeft: '12px' }}>
          {parsedPlan.sections.length} sections
        </span>
      </div>

      {/* Sections */}
      <PlanSections sections={parsedPlan.sections} />
    </div>
  );
}

function PlanSections({ sections }: { sections: PlanSection[] }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div style={{
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      overflow: 'hidden',
    }}>
      {/* Controls */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', color: '#8b949e', marginRight: 'auto' }}>
          Sections
        </span>
        <button
          onClick={expandAll}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#8b949e',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Expand all
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#8b949e',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Collapse all
        </button>
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6e7681' }}>
          No sections found
        </div>
      ) : (
        sections.map((section, index) => (
          <PlanSectionItem
            key={section.id}
            section={section}
            index={index}
            totalSections={sections.length}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))
      )}
    </div>
  );
}

interface PlanSectionItemProps {
  section: PlanSection;
  index: number;
  totalSections: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function PlanSectionItem({ section, index, totalSections, isExpanded, onToggle }: PlanSectionItemProps) {
  return (
    <div style={{ borderBottom: '1px solid #21262d' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ color: '#6e7681', fontSize: '12px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9' }}>
          {section.title}
        </span>
        <span style={{ color: '#6e7681', fontSize: '12px', marginLeft: 'auto' }}>
          [{index + 1}/{totalSections}]
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div style={{
          padding: '16px',
          paddingTop: '0',
          marginLeft: '24px',
        }}>
          <MarkdownContent content={section.content} codeBlocks={section.codeBlocks} />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content, codeBlocks }: { content: string; codeBlocks: CodeBlock[] }) {
  // Simple markdown rendering - split by code blocks and render alternating text/code
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockIndex = 0;
  let currentTextLines: string[] = [];
  let key = 0;

  const flushText = () => {
    if (currentTextLines.length > 0) {
      elements.push(
        <div key={key++} style={{ marginBottom: '8px' }}>
          {currentTextLines.map((line, i) => renderLine(line, i))}
        </div>
      );
      currentTextLines = [];
    }
  };

  const renderLine = (line: string, lineKey: number): React.ReactNode => {
    // Heading within section
    if (line.match(/^#{1,6}\s/)) {
      return (
        <div key={lineKey} style={{ fontWeight: 600, color: '#c9d1d9', marginBottom: '4px' }}>
          {line.replace(/^#+\s*/, '')}
        </div>
      );
    }

    // Bullet point
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={lineKey} style={{ paddingLeft: '16px', color: '#c9d1d9' }}>
          • {line.slice(2)}
        </div>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={lineKey} style={{ paddingLeft: '16px', color: '#c9d1d9' }}>
          {line}
        </div>
      );
    }

    // Empty line
    if (line.trim() === '') {
      return <div key={lineKey} style={{ height: '8px' }} />;
    }

    // Table line
    if (line.includes('|')) {
      return (
        <div key={lineKey} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8b949e' }}>
          {line}
        </div>
      );
    }

    // Regular text
    return (
      <div key={lineKey} style={{ color: '#c9d1d9' }}>
        {line}
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render it
        inCodeBlock = false;
        flushText();

        if (codeBlocks[codeBlockIndex]) {
          const block = codeBlocks[codeBlockIndex];
          elements.push(
            <div key={key++} style={{
              margin: '8px 0',
              background: '#0d1117',
              borderRadius: '6px',
              border: '1px solid #30363d',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '6px 12px',
                borderBottom: '1px solid #30363d',
                fontSize: '11px',
                color: '#8b949e',
              }}>
                {block.language || 'code'}
              </div>
              <pre style={{
                margin: 0,
                padding: '12px',
                fontSize: '12px',
                color: '#c9d1d9',
                overflow: 'auto',
              }}>
                {block.code}
              </pre>
            </div>
          );
          codeBlockIndex++;
        }
      } else {
        // Start of code block
        inCodeBlock = true;
        flushText();
      }
    } else if (!inCodeBlock) {
      currentTextLines.push(line);
    }
  }

  flushText();

  return <>{elements}</>;
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8b949e' }}>
      <p>Loading plan...</p>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#f85149',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #da3633',
    }}>
      <p style={{ marginBottom: '8px' }}>Error loading plan</p>
      <p style={{ fontSize: '14px', color: '#8b949e' }}>{error.message}</p>
    </div>
  );
}

function NotFoundState({ filename }: { filename: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#8b949e',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
    }}>
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>Plan not found</p>
      <p style={{ fontSize: '14px' }}>{filename} may have been deleted or moved</p>
      <Link to="/plans" style={{ display: 'inline-block', marginTop: '16px' }}>
        ← Back to plans
      </Link>
    </div>
  );
}
