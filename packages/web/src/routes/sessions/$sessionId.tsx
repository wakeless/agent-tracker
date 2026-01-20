import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getSession, getTranscript } from '../../server/sessions';
import { Session, ParsedTranscriptEntry } from '@agent-tracker/core';

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetailPage,
});

const ENTRIES_PER_PAGE = 50;

function SessionDetailPage() {
  const { sessionId } = Route.useParams();

  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession({ data: sessionId }),
    refetchInterval: 5000,
  });

  const session = sessionData?.session;

  const {
    data: transcriptData,
    isLoading: transcriptLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['transcript', session?.transcriptPath],
    queryFn: async ({ pageParam }) => {
      if (!session?.transcriptPath) {
        return { entries: [], total: 0, hasMore: false };
      }
      return getTranscript({
        data: {
          path: session.transcriptPath,
          limit: ENTRIES_PER_PAGE,
          before: pageParam,
        },
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.oldestTimestamp : undefined,
    enabled: !!session?.transcriptPath,
    refetchInterval: 5000,
  });

  // Flatten all pages into single array
  const allEntries = useMemo(() => {
    if (!transcriptData?.pages) return [];
    return transcriptData.pages.flatMap(page => page.entries);
  }, [transcriptData]);

  const total = transcriptData?.pages[0]?.total || 0;

  if (sessionLoading) {
    return <LoadingState />;
  }

  if (sessionError) {
    return <ErrorState error={sessionError} />;
  }

  if (!session) {
    return <NotFoundState sessionId={sessionId} />;
  }

  const displayName = session.displayName || session.cwd.split('/').pop() || 'Unknown';
  const statusColors: Record<string, string> = {
    active: '#3fb950',
    inactive: '#8b949e',
    ended: '#f85149',
  };

  return (
    <div>
      {/* Minimal header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ color: '#58a6ff', fontSize: '13px' }}>
          ←
        </Link>
        <span style={{
          color: statusColors[session.status] || '#8b949e',
          fontSize: '12px',
        }}>
          ●
        </span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#c9d1d9' }}>
          {displayName}
        </span>
        {session.awaitingInput && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: '#9e6a03',
            color: '#f0883e',
            fontSize: '11px',
          }}>
            awaiting input
          </span>
        )}
      </div>

      <HighlightsSection entries={allEntries} />

      <TranscriptSection
        entries={allEntries}
        total={total}
        hasMore={hasNextPage || false}
        isLoading={transcriptLoading}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Collapsed view - just show summary counts
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '8px 12px',
          marginBottom: '12px',
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        <span>▶</span>
        <span>Highlights:</span>
        {counts.plans > 0 && <span style={{ color: '#a371f7' }}>{counts.plans} plans</span>}
        {counts.tasks > 0 && <span style={{ color: '#f0883e' }}>{counts.tasks} tasks</span>}
        {counts.errors > 0 && <span style={{ color: '#f85149' }}>{counts.errors} errors</span>}
        {counts.user > 0 && <span style={{ color: '#58a6ff' }}>{counts.user} user</span>}
      </button>
    );
  }

  return (
    <div style={{
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      marginBottom: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#8b949e',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '10px',
          }}
        >
          ▼
        </button>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#c9d1d9', marginRight: '4px' }}>
          Highlights
        </span>
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
  isFetchingMore: boolean;
  onLoadMore: () => void;
}

function TranscriptSection({ entries, total, hasMore, isLoading, isFetchingMore, onLoadMore }: TranscriptSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll - use scroll event for reliability
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isFetchingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Trigger when within 200px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 200) {
        onLoadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, isFetchingMore, onLoadMore]);

  return (
    <div style={{
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', color: '#8b949e' }}>
          Transcript
          <span style={{ marginLeft: '8px' }}>
            {entries.length} of {total}
          </span>
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          height: 'calc(100vh - 280px)',
          overflowY: 'auto',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
            <div style={{ marginBottom: '8px' }}>Loading transcript...</div>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #30363d',
              borderTopColor: '#58a6ff',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6e7681' }}>
            No transcript entries yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entries.map((entry, index) => (
              <TranscriptEntry key={entry.uuid || index} entry={entry} />
            ))}

            {/* Loading indicator / Load more button */}
            <div style={{ padding: '16px', textAlign: 'center' }}>
              {isFetchingMore ? (
                <span style={{ color: '#8b949e', fontSize: '12px' }}>Loading more...</span>
              ) : hasMore ? (
                <button
                  onClick={() => onLoadMore()}
                  style={{
                    padding: '6px 16px',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#58a6ff',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Load more
                </button>
              ) : entries.length > 0 ? (
                <span style={{ color: '#6e7681', fontSize: '12px' }}>End of transcript</span>
              ) : null}
            </div>
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
