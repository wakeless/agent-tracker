import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSession, getTranscript } from '../../server/sessions';
import { ParsedTranscriptEntry } from '@agent-tracker/core';
import { useState, useEffect, useCallback } from 'react';

export const Route = createFileRoute('/sessions/$sessionId/transcript')({
  component: TranscriptPage,
});

function TranscriptPage() {
  const { sessionId } = Route.useParams();
  const [showSystemEntries, setShowSystemEntries] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession({ data: sessionId }),
  });

  const { data: transcriptData, isLoading: transcriptLoading } = useQuery({
    queryKey: ['transcript', sessionData?.session?.transcriptPath],
    queryFn: () =>
      sessionData?.session?.transcriptPath
        ? getTranscript({ data: sessionData.session.transcriptPath })
        : Promise.resolve({ entries: [], total: 0 }),
    enabled: !!sessionData?.session?.transcriptPath,
    refetchInterval: 5000, // Poll for new entries
  });

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const entries = getFilteredEntries();
      if (entries.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, entries.length - 1)
        );
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? entries.length - 1 : Math.max(prev - 1, 0)
        );
      } else if (e.key === 'G') {
        e.preventDefault();
        setSelectedIndex(entries.length - 1);
      } else if (e.key === 'g') {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === 's') {
        e.preventDefault();
        setShowSystemEntries((prev) => !prev);
      }
    },
    [transcriptData]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll to selected entry
  useEffect(() => {
    if (selectedIndex !== null) {
      const element = document.getElementById(`entry-${selectedIndex}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  const getFilteredEntries = useCallback(() => {
    if (!transcriptData?.entries) return [];
    if (showSystemEntries) return transcriptData.entries;
    return transcriptData.entries.filter(
      (entry) => entry.type !== 'system' && entry.type !== 'file-history' && entry.type !== 'meta'
    );
  }, [transcriptData, showSystemEntries]);

  if (sessionLoading || transcriptLoading) {
    return <LoadingState />;
  }

  if (!sessionData?.session) {
    return <NotFoundState sessionId={sessionId} />;
  }

  const session = sessionData.session;
  const filteredEntries = getFilteredEntries();
  const displayName = session.displayName || session.cwd.split('/').pop() || 'Unknown';

  return (
    <div>
      {/* Header */}
      <nav style={{ marginBottom: '16px' }}>
        <Link to="/sessions/$sessionId" params={{ sessionId }} style={{ color: '#58a6ff', fontSize: '14px' }}>
          Back to session
        </Link>
      </nav>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
            {displayName} - Transcript
          </h2>
          <p style={{ color: '#8b949e', fontSize: '14px' }}>
            {filteredEntries.length} entries
            {transcriptData && transcriptData.total !== filteredEntries.length && (
              <span> ({transcriptData.total} total)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowSystemEntries(!showSystemEntries)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: showSystemEntries ? '#238636' : '#30363d',
            color: showSystemEntries ? '#3fb950' : '#8b949e',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          System: {showSystemEntries ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Transcript entries */}
      {filteredEntries.length === 0 ? (
        <EmptyTranscript />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredEntries.map((entry, index) => (
            <TranscriptEntry
              key={entry.uuid}
              entry={entry}
              index={index}
              isSelected={selectedIndex === index}
              onSelect={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Keyboard help */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#161b22',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #30363d',
          color: '#8b949e',
          fontSize: '13px',
        }}
      >
        j/k: Navigate | g/G: Top/Bottom | s: Toggle system entries
      </div>
    </div>
  );
}

interface TranscriptEntryProps {
  entry: ParsedTranscriptEntry;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

function TranscriptEntry({ entry, index, isSelected, onSelect }: TranscriptEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getColor = () => {
    if (entry.type === 'user') return '#58a6ff';
    if (entry.type === 'tool_use') return '#f0883e';
    if (entry.type === 'tool_result') return entry.isError ? '#f85149' : '#8b949e';
    if (entry.type === 'thinking') return '#a371f7';
    if (entry.type === 'system') return '#6e7681';
    if (entry.type === 'file-history') return '#6e7681';
    if (entry.type === 'meta') return '#6e7681';
    return '#3fb950';
  };

  const getLabel = () => {
    if (entry.type === 'user') return 'User';
    if (entry.type === 'tool_use') return entry.toolName || 'Tool Use';
    if (entry.type === 'tool_result') return entry.isError ? 'Tool Error' : 'Tool Result';
    if (entry.type === 'thinking') return 'Thinking';
    if (entry.type === 'system') return 'System';
    if (entry.type === 'file-history') return 'File History';
    if (entry.type === 'meta') return 'Meta';
    return 'Assistant';
  };

  const lines = entry.content.split('\n');
  const lineCount = lines.length;
  const displayContent = isExpanded ? entry.content : lines.slice(0, 3).join('\n');
  const hasMore = lineCount > 3;

  return (
    <div
      id={`entry-${index}`}
      onClick={onSelect}
      onDoubleClick={() => setIsExpanded(!isExpanded)}
      style={{
        padding: '12px 16px',
        background: '#161b22',
        borderRadius: '8px',
        border: `1px solid ${isSelected ? '#58a6ff' : '#30363d'}`,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {isSelected && <span style={{ color: '#58a6ff' }}>{'>'}</span>}
        <span style={{ color: '#6e7681', fontSize: '13px' }}>
          [{index + 1}] {formatTime(entry.timestamp)}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: `${getColor()}22`,
            color: getColor(),
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {getLabel()}
        </span>
        {lineCount > 1 && (
          <span style={{ color: '#6e7681', fontSize: '12px' }}>({lineCount} lines)</span>
        )}
        {hasMore && !isExpanded && (
          <span style={{ color: '#6e7681', fontSize: '12px' }}>[collapsed]</span>
        )}
      </div>

      {/* Content */}
      <div style={{ marginLeft: '16px' }}>
        {entry.type === 'tool_use' && entry.toolInput ? (
          <ToolContent toolName={entry.toolName || 'Tool'} toolInput={entry.toolInput} isExpanded={isExpanded} />
        ) : (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#c9d1d9',
            }}
          >
            {displayContent}
            {hasMore && !isExpanded && (
              <span style={{ color: '#6e7681' }}>{'\n'}...</span>
            )}
          </pre>
        )}
      </div>

      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            marginTop: '8px',
            marginLeft: '16px',
            background: 'none',
            border: 'none',
            color: '#58a6ff',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
}

interface ToolContentProps {
  toolName: string;
  toolInput: Record<string, unknown>;
  isExpanded: boolean;
}

function ToolContent({ toolName, toolInput, isExpanded }: ToolContentProps) {
  // Simple tool content display
  if (toolName === 'Bash' && typeof toolInput.command === 'string') {
    return (
      <div>
        <code
          style={{
            display: 'block',
            background: '#0d1117',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#f0883e',
          }}
        >
          $ {toolInput.command}
        </code>
        {toolInput.description && (
          <p style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>
            {String(toolInput.description)}
          </p>
        )}
      </div>
    );
  }

  if ((toolName === 'Read' || toolName === 'Glob' || toolName === 'Grep') && toolInput.file_path) {
    return (
      <div>
        <code
          style={{
            display: 'block',
            background: '#0d1117',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#58a6ff',
          }}
        >
          {String(toolInput.file_path)}
        </code>
      </div>
    );
  }

  if (toolName === 'Edit' && toolInput.file_path) {
    return (
      <div>
        <code
          style={{
            display: 'block',
            background: '#0d1117',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#3fb950',
          }}
        >
          Editing: {String(toolInput.file_path)}
        </code>
        {isExpanded && toolInput.old_string && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ color: '#f85149', fontSize: '12px', marginBottom: '4px' }}>- Old:</div>
            <pre
              style={{
                background: '#1c1210',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#f85149',
                margin: 0,
              }}
            >
              {String(toolInput.old_string)}
            </pre>
            <div style={{ color: '#3fb950', fontSize: '12px', marginTop: '8px', marginBottom: '4px' }}>
              + New:
            </div>
            <pre
              style={{
                background: '#0e1a10',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#3fb950',
                margin: 0,
              }}
            >
              {String(toolInput.new_string)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Default: show JSON
  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#8b949e',
        background: '#0d1117',
        padding: '8px',
        borderRadius: '4px',
      }}
    >
      {isExpanded
        ? JSON.stringify(toolInput, null, 2)
        : JSON.stringify(toolInput, null, 2).slice(0, 200) + '...'}
    </pre>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
      }}
    >
      <p>Loading transcript...</p>
    </div>
  );
}

function NotFoundState({ sessionId }: { sessionId: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}
    >
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>Session not found</p>
      <p style={{ fontSize: '14px' }}>Session {sessionId} may have ended or been removed</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '16px' }}>
        Back to sessions
      </Link>
    </div>
  );
}

function EmptyTranscript() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}
    >
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>No transcript entries yet</p>
      <p style={{ fontSize: '14px' }}>
        Start interacting with the Claude session to see the transcript here
      </p>
    </div>
  );
}
