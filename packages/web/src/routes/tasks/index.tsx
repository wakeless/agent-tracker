import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTaskSummaries, SerializedTaskSummary } from '../../server/tasks';

export const Route = createFileRoute('/tasks/')({
  component: TasksListPage,
});

function TasksListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTaskSummaries(),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  const { taskSets, total } = data || { taskSets: [], total: 0 };

  // Calculate totals
  const totals = taskSets.reduce(
    (acc, ts) => ({
      pending: acc.pending + ts.pending,
      inProgress: acc.inProgress + ts.inProgress,
      completed: acc.completed + ts.completed,
    }),
    { pending: 0, inProgress: 0, completed: 0 }
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#c9d1d9', fontSize: '20px', marginBottom: '8px' }}>
          Task Explorer
        </h2>
        <p style={{ color: '#8b949e', fontSize: '14px' }}>
          Browse tasks from ~/.claude/tasks/ ({total} conversations)
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <span style={{ color: '#8b949e' }}>
            Pending: <span style={{ color: '#8b949e' }}>{totals.pending}</span>
          </span>
          <span style={{ color: '#8b949e' }}>
            Active: <span style={{ color: '#d29922' }}>{totals.inProgress}</span>
          </span>
          <span style={{ color: '#8b949e' }}>
            Done: <span style={{ color: '#3fb950' }}>{totals.completed}</span>
          </span>
        </div>
      </div>
      <TaskSetsList taskSets={taskSets} />
    </div>
  );
}

function TaskSetsList({ taskSets }: { taskSets: SerializedTaskSummary[] }) {
  if (taskSets.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>No task sets found</p>
        <p style={{ fontSize: '14px' }}>Tasks will appear here when created by Claude Code</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {taskSets.map((taskSet) => (
        <TaskSetCard key={taskSet.conversationId} taskSet={taskSet} />
      ))}
    </div>
  );
}

function TaskSetCard({ taskSet }: { taskSet: SerializedTaskSummary }) {
  const timeAgo = formatTimeAgo(new Date(taskSet.lastModified));
  const truncatedId = taskSet.conversationId.substring(0, 8) + '...';

  return (
    <Link
      to="/tasks/$conversationId"
      params={{ conversationId: taskSet.conversationId }}
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
        (e.currentTarget as HTMLElement).style.borderColor = '#d29922';
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
              background: '#4d3800',
              color: '#d29922',
              fontSize: '12px',
              fontWeight: 500,
            }}>
              {taskSet.taskCount} tasks
            </span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#c9d1d9' }}>
            Conversation {truncatedId}
          </h3>
        </div>
        <span style={{ color: '#8b949e', fontSize: '13px' }}>{timeAgo}</span>
      </div>
      <div style={{ fontSize: '13px', color: '#8b949e', display: 'flex', gap: '12px' }}>
        <span>
          <span style={{ color: '#8b949e' }}>{taskSet.pending}</span> pending
        </span>
        <span>
          <span style={{ color: '#d29922' }}>{taskSet.inProgress}</span> active
        </span>
        <span>
          <span style={{ color: '#3fb950' }}>{taskSet.completed}</span> done
        </span>
      </div>
      <div style={{ marginTop: '8px' }}>
        <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#8b949e' }}>
          {taskSet.conversationId}
        </code>
      </div>
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
      <p>Loading tasks...</p>
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
      <p style={{ marginBottom: '8px' }}>Error loading tasks</p>
      <p style={{ fontSize: '14px', color: '#8b949e' }}>{error.message}</p>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
