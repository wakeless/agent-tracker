import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { getSession, getTranscript } from '../../server/sessions';
import { Session, ParsedTranscriptEntry } from '@agent-tracker/core';

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetailPage,
});

const ENTRIES_PER_PAGE = 50;

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const [limit, setLimit] = useState(ENTRIES_PER_PAGE);

  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession({ data: sessionId }),
    refetchInterval: 5000,
  });

  const session = sessionData?.session;

  const { data: transcriptData, isLoading: transcriptLoading } = useQuery({
    queryKey: ['transcript', session?.transcriptPath, limit],
    queryFn: () =>
      session?.transcriptPath
        ? getTranscript({ data: { path: session.transcriptPath, limit, offset: 0 } })
        : Promise.resolve({ entries: [], total: 0, hasMore: false }),
    enabled: !!session?.transcriptPath,
    refetchInterval: 5000,
  });

  const loadMore = useCallback(() => {
    setLimit(prev => prev + ENTRIES_PER_PAGE);
  }, []);

  if (sessionLoading) {
    return <LoadingState />;
  }

  if (sessionError) {
    return <ErrorState error={sessionError} />;
  }

  if (!session) {
    return <NotFoundState sessionId={sessionId} />;
  }

  return (
    <div>
      <nav style={{ marginBottom: '24px' }}>
        <Link to="/" style={{ color: '#58a6ff', fontSize: '14px' }}>
          ← Back to sessions
        </Link>
      </nav>

      <SessionHeader session={session} />

      <div style={{
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        marginBottom: '24px',
      }}>
        <DetailCard title="Working Directory">
          <code style={{ wordBreak: 'break-all', fontSize: '13px' }}>{session.cwd}</code>
        </DetailCard>

        {session.git?.branch && (
          <DetailCard title="Git">
            <span style={{ color: '#58a6ff' }}>{session.git.branch}</span>
          </DetailCard>
        )}

        <DetailCard title="Timestamps">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#8b949e' }}>Started: </span>
              {formatDate(session.startTime)}
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>Last: </span>
              {formatDate(session.lastActivityTime)}
            </div>
          </div>
        </DetailCard>
      </div>

      <HighlightsSection entries={transcriptData?.entries || []} />

      <TranscriptSection
        entries={transcriptData?.entries || []}
        total={transcriptData?.total || 0}
        hasMore={transcriptData?.hasMore || false}
        isLoading={transcriptLoading}
        onLoadMore={loadMore}
      />
    </div>
  );
}

function SessionHeader({ session }: { session: Session }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#238636', text: '#3fb950' },
    inactive: { bg: '#30363d', text: '#8b949e' },
    ended: { bg: '#da3633', text: '#f85149' },
  };

  const { bg, text } = statusColors[session.status] || statusColors.inactive;
  const displayName = session.displayName || session.cwd.split('/').pop() || 'Unknown';

  return (
    <div style={{
      padding: '20px',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{
          padding: '3px 10px',
          borderRadius: '16px',
          background: bg,
          color: text,
          fontSize: '13px',
          fontWeight: 500,
        }}>
          {session.status}
        </span>
        {session.awaitingInput && (
          <span style={{
            padding: '3px 10px',
            borderRadius: '16px',
            background: '#9e6a03',
            color: '#f0883e',
            fontSize: '13px',
          }}>
            awaiting input
          </span>
        )}
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
        {displayName}
      </h2>
      <p style={{ color: '#6e7681', fontSize: '12px' }}>
        {session.id}
      </p>
    </div>
  );
}

interface HighlightItem {
  type: 'plan' | 'task' | 'error' | 'user';
  entry: ParsedTranscriptEntry;
  summary: string;
}

function extractHighlights(entries: ParsedTranscriptEntry[]): HighlightItem[] {
  const highlights: HighlightItem[] = [];

  for (const entry of entries) {
    // Extract plans (Write to .md files in .claude/plans)
    if (entry.type === 'tool_use' && entry.toolName === 'Write') {
      const filePath = entry.toolInput?.file_path as string;
      if (filePath?.includes('.claude/plans') || filePath?.endsWith('.md')) {
        highlights.push({
          type: 'plan',
          entry,
          summary: `Plan: ${filePath?.split('/').pop() || 'unknown'}`,
        });
      }
    }

    // Extract Task/Agent launches
    if (entry.type === 'tool_use' && entry.toolName === 'Task') {
      const description = entry.toolInput?.description as string;
      const subagentType = entry.toolInput?.subagent_type as string;
      highlights.push({
        type: 'task',
        entry,
        summary: `${subagentType || 'Agent'}: ${description || 'task'}`,
      });
    }

    // Extract errors
    if (entry.type === 'tool_result' && entry.isError) {
      const content = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
      highlights.push({
        type: 'error',
        entry,
        summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      });
    }

    // Extract user messages
    if (entry.type === 'user') {
      const content = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
      highlights.push({
        type: 'user',
        entry,
        summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      });
    }
  }

  // Return most recent first, limited to 20 items
  return highlights.reverse().slice(0, 20);
}

function HighlightsSection({ entries }: { entries: ParsedTranscriptEntry[] }) {
  const [activeTab, setActiveTab] = useState<'all' | 'plans' | 'tasks' | 'errors' | 'user'>('all');
  const highlights = useMemo(() => extractHighlights(entries), [entries]);

  const filteredHighlights = useMemo(() => {
    if (activeTab === 'all') return highlights;
    return highlights.filter(h => h.type === activeTab.replace('s', '') as HighlightItem['type']);
  }, [highlights, activeTab]);

  const counts = useMemo(() => ({
    plans: highlights.filter(h => h.type === 'plan').length,
    tasks: highlights.filter(h => h.type === 'task').length,
    errors: highlights.filter(h => h.type === 'error').length,
    user: highlights.filter(h => h.type === 'user').length,
  }), [highlights]);

  if (highlights.length === 0) return null;

  const getTypeColor = (type: HighlightItem['type']) => {
    switch (type) {
      case 'plan': return '#a371f7';
      case 'task': return '#f0883e';
      case 'error': return '#f85149';
      case 'user': return '#58a6ff';
    }
  };

  const getTypeLabel = (type: HighlightItem['type']) => {
    switch (type) {
      case 'plan': return 'Plan';
      case 'task': return 'Task';
      case 'error': return 'Error';
      case 'user': return 'User';
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      marginBottom: '16px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9', marginRight: '8px' }}>
          Highlights
        </h3>
        {(['all', 'plans', 'tasks', 'errors', 'user'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: 'none',
              background: activeTab === tab ? '#30363d' : 'transparent',
              color: activeTab === tab ? '#c9d1d9' : '#6e7681',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {tab === 'all' ? `All (${highlights.length})` :
             tab === 'plans' ? `Plans (${counts.plans})` :
             tab === 'tasks' ? `Tasks (${counts.tasks})` :
             tab === 'errors' ? `Errors (${counts.errors})` :
             `User (${counts.user})`}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {filteredHighlights.map((highlight, index) => (
          <div
            key={highlight.entry.uuid || index}
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid #21262d',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <span style={{ color: '#6e7681', fontSize: '11px', minWidth: '50px' }}>
              {formatTime(highlight.entry.timestamp)}
            </span>
            <span style={{
              padding: '1px 6px',
              borderRadius: '4px',
              background: `${getTypeColor(highlight.type)}22`,
              color: getTypeColor(highlight.type),
              fontSize: '11px',
              fontWeight: 500,
              flexShrink: 0,
            }}>
              {getTypeLabel(highlight.type)}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#c9d1d9',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {highlight.summary}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TranscriptSectionProps {
  entries: ParsedTranscriptEntry[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

function TranscriptSection({ entries, total, hasMore, isLoading, onLoadMore }: TranscriptSectionProps) {
  return (
    <div style={{
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9' }}>
          Transcript
          <span style={{ color: '#6e7681', fontWeight: 400, marginLeft: '8px' }}>
            {entries.length} of {total} entries
          </span>
        </h3>
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            style={{
              padding: '4px 12px',
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#58a6ff',
              fontSize: '12px',
              cursor: isLoading ? 'wait' : 'pointer',
            }}
          >
            {isLoading ? 'Loading...' : 'Load older'}
          </button>
        )}
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {entries.length === 0 && !isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6e7681' }}>
            No transcript entries yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...entries].reverse().map((entry, index) => (
              <TranscriptEntry key={entry.uuid || index} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TranscriptEntry({ entry }: { entry: ParsedTranscriptEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColor = () => {
    if (entry.type === 'user') return '#58a6ff';
    if (entry.type === 'tool_use') return '#f0883e';
    if (entry.type === 'tool_result') return entry.isError ? '#f85149' : '#8b949e';
    if (entry.type === 'thinking') return '#a371f7';
    return '#3fb950';
  };

  const getLabel = () => {
    if (entry.type === 'user') return 'User';
    if (entry.type === 'tool_use') return entry.toolName || 'Tool';
    if (entry.type === 'tool_result') return entry.isError ? 'Error' : 'Result';
    if (entry.type === 'thinking') return 'Think';
    return 'Claude';
  };

  const contentStr = typeof entry.content === 'string'
    ? entry.content
    : JSON.stringify(entry.content, null, 2);
  const lines = contentStr.split('\n');
  const displayContent = isExpanded ? contentStr : lines.slice(0, 3).join('\n');
  const hasMore = lines.length > 3;

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={() => hasMore && setIsExpanded(!isExpanded)}
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid #21262d',
        cursor: hasMore ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ color: '#6e7681', fontSize: '11px', minWidth: '50px' }}>
          {formatTime(entry.timestamp)}
        </span>
        <span style={{
          padding: '1px 6px',
          borderRadius: '4px',
          background: `${getColor()}22`,
          color: getColor(),
          fontSize: '11px',
          fontWeight: 500,
        }}>
          {getLabel()}
        </span>
        {hasMore && (
          <span style={{ color: '#6e7681', fontSize: '11px' }}>
            ({lines.length} lines) {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {entry.type === 'tool_use' && entry.toolName === 'Bash' && entry.toolInput?.command ? (
        <code style={{
          display: 'block',
          background: '#0d1117',
          padding: '6px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#f0883e',
          marginTop: '4px',
        }}>
          $ {String(entry.toolInput.command)}
        </code>
      ) : (
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '12px',
          color: '#c9d1d9',
          lineHeight: 1.5,
        }}>
          {displayContent}
          {hasMore && !isExpanded && <span style={{ color: '#6e7681' }}>...</span>}
        </pre>
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
    }}>
      <h3 style={{
        fontSize: '11px',
        fontWeight: 500,
        color: '#6e7681',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </h3>
      <div style={{ color: '#c9d1d9' }}>
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8b949e' }}>
      <p>Loading session...</p>
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
      <p style={{ marginBottom: '8px' }}>Error loading session</p>
      <p style={{ fontSize: '14px', color: '#8b949e' }}>{error.message}</p>
    </div>
  );
}

function NotFoundState({ sessionId }: { sessionId: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#8b949e',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
    }}>
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>Session not found</p>
      <p style={{ fontSize: '14px' }}>Session {sessionId} may have ended or been removed</p>
      <Link to="/" style={{ display: 'inline-block', marginTop: '16px' }}>
        ← Back to sessions
      </Link>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString();
}
