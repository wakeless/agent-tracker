import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../server/sessions';
import { Session } from '@agent-tracker/core';

export const Route = createFileRoute('/')({
  component: SessionListPage,
});

function SessionListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const { sessions, counts } = data || { sessions: [], counts: { total: 0, active: 0, inactive: 0, ended: 0, awaitingInput: 0 } };

  return (
    <div>
      <SessionCounts counts={counts} />
      <SessionList sessions={sessions} />
    </div>
  );
}

function SessionCounts({ counts }: { counts: { total: number; active: number; inactive: number; ended: number; awaitingInput: number } }) {
  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <CountBadge label="Total" count={counts.total} color="#8b949e" />
      <CountBadge label="Active" count={counts.active} color="#3fb950" />
      <CountBadge label="Awaiting Input" count={counts.awaitingInput} color="#f0883e" />
      <CountBadge label="Inactive" count={counts.inactive} color="#8b949e" />
      <CountBadge label="Ended" count={counts.ended} color="#f85149" />
    </div>
  );
}

function CountBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#161b22',
      borderRadius: '6px',
      border: '1px solid #30363d',
    }}>
      <span style={{ color: '#8b949e', fontSize: '13px' }}>{label}</span>
      <span style={{ color, fontWeight: 600, fontSize: '16px' }}>{count}</span>
    </div>
  );
}

function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>No sessions found</p>
        <p style={{ fontSize: '14px' }}>Start a Claude Code session to see it here</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#238636', text: '#3fb950' },
    inactive: { bg: '#30363d', text: '#8b949e' },
    ended: { bg: '#da3633', text: '#f85149' },
  };

  const { bg, text } = statusColors[session.status] || statusColors.inactive;

  const timeAgo = formatTimeAgo(session.lastActivityTime);
  const displayName = session.displayName || session.cwd.split('/').pop() || 'Unknown';

  return (
    <Link
      to="/sessions/$sessionId"
      params={{ sessionId: session.id }}
      style={{
        display: 'block',
        padding: '16px',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s',
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#58a6ff';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#30363d';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              background: bg,
              color: text,
              fontSize: '12px',
              fontWeight: 500,
            }}>
              {session.status}
            </span>
            {session.awaitingInput && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#9e6a03',
                color: '#f0883e',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                awaiting input
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#c9d1d9' }}>
            {displayName}
          </h3>
        </div>
        <span style={{ color: '#8b949e', fontSize: '13px' }}>{timeAgo}</span>
      </div>
      <div style={{ fontSize: '13px', color: '#8b949e' }}>
        <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>
          {session.cwd}
        </code>
      </div>
      {session.git?.branch && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#8b949e' }}>
          <span style={{ color: '#58a6ff' }}>⎇</span> {session.git.branch}
        </div>
      )}
    </Link>
  );
}

function LoadingState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#8b949e',
    }}>
      <p>Loading sessions...</p>
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
      <p style={{ marginBottom: '8px' }}>Error loading sessions</p>
      <p style={{ fontSize: '14px', color: '#8b949e' }}>{error.message}</p>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
