import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '../../server/sessions';
import { Session } from '@agent-tracker/core';

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession({ data: sessionId }),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const { session } = data || { session: null };

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
      <SessionDetails session={session} />
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
      padding: '24px',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: '16px',
          background: bg,
          color: text,
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {session.status}
        </span>
        {session.awaitingInput && (
          <span style={{
            padding: '4px 12px',
            borderRadius: '16px',
            background: '#9e6a03',
            color: '#f0883e',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            awaiting input
          </span>
        )}
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        {displayName}
      </h2>
      <p style={{ color: '#8b949e', fontSize: '14px' }}>
        Session ID: <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>
          {session.id}
        </code>
      </p>
    </div>
  );
}

function SessionDetails({ session }: { session: Session }) {
  return (
    <div style={{
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    }}>
      <DetailCard title="Working Directory">
        <code style={{ wordBreak: 'break-all' }}>{session.cwd}</code>
      </DetailCard>

      {session.git?.branch && (
        <DetailCard title="Git Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ color: '#8b949e' }}>Branch: </span>
              <span style={{ color: '#58a6ff' }}>{session.git.branch}</span>
            </div>
            {session.git.repo_name && (
              <div>
                <span style={{ color: '#8b949e' }}>Repository: </span>
                <span>{session.git.repo_name}</span>
              </div>
            )}
          </div>
        </DetailCard>
      )}

      <DetailCard title="Timestamps">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#8b949e' }}>Started: </span>
            <span>{formatDate(session.startTime)}</span>
          </div>
          <div>
            <span style={{ color: '#8b949e' }}>Last Activity: </span>
            <span>{formatDate(session.lastActivityTime)}</span>
          </div>
          {session.endTime && (
            <div>
              <span style={{ color: '#8b949e' }}>Ended: </span>
              <span>{formatDate(session.endTime)}</span>
            </div>
          )}
        </div>
      </DetailCard>

      <DetailCard title="Transcript">
        <div style={{ fontSize: '14px' }}>
          <code style={{ wordBreak: 'break-all', color: '#8b949e', display: 'block', marginBottom: '12px' }}>
            {session.transcriptPath}
          </code>
          <Link
            to="/sessions/$sessionId/transcript"
            params={{ sessionId: session.id }}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#238636',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            View Transcript
          </Link>
        </div>
      </DetailCard>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '16px',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
    }}>
      <h3 style={{
        fontSize: '14px',
        fontWeight: 500,
        color: '#8b949e',
        marginBottom: '12px',
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
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#8b949e',
    }}>
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
