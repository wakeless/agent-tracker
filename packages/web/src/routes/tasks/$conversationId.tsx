import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTasksForConversation, SerializedTask } from '../../server/tasks';

export const Route = createFileRoute('/tasks/$conversationId')({
  component: TaskSetDetailPage,
});

function TaskSetDetailPage() {
  const { conversationId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', conversationId],
    queryFn: () => getTasksForConversation({ data: conversationId }),
    refetchInterval: 5000, // Poll every 5 seconds for task updates
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  const { taskSet } = data || { taskSet: null };

  if (!taskSet) {
    return <NotFoundState conversationId={conversationId} />;
  }

  // Calculate counts
  const counts = {
    pending: taskSet.tasks.filter((t) => t.status === 'pending').length,
    inProgress: taskSet.tasks.filter((t) => t.status === 'in_progress').length,
    completed: taskSet.tasks.filter((t) => t.status === 'completed').length,
  };

  const truncatedId = conversationId.substring(0, 12) + '...';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/tasks" style={{ color: '#58a6ff', textDecoration: 'none' }}>
          Tasks
        </Link>
        <span style={{ color: '#8b949e', margin: '0 8px' }}>/</span>
        <span style={{ color: '#c9d1d9' }}>{truncatedId}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#c9d1d9', fontSize: '20px', marginBottom: '8px' }}>
          Task Set
        </h2>
        <p style={{ color: '#8b949e', fontSize: '14px', marginBottom: '8px' }}>
          <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>
            {conversationId}
          </code>
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ color: '#8b949e' }}>
            Total: <span style={{ color: '#c9d1d9', fontWeight: 500 }}>{taskSet.tasks.length}</span>
          </span>
          <span style={{ color: '#8b949e' }}>
            Pending: <span style={{ color: '#8b949e' }}>{counts.pending}</span>
          </span>
          <span style={{ color: '#8b949e' }}>
            Active: <span style={{ color: '#d29922' }}>{counts.inProgress}</span>
          </span>
          <span style={{ color: '#8b949e' }}>
            Done: <span style={{ color: '#3fb950' }}>{counts.completed}</span>
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <TasksList tasks={taskSet.tasks} />
    </div>
  );
}

function TasksList({ tasks }: { tasks: SerializedTask[] }) {
  if (tasks.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}>
        <p>No tasks in this conversation</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: SerializedTask }) {
  const statusConfig = getStatusConfig(task.status);

  return (
    <div
      style={{
        padding: '16px',
        background: '#161b22',
        borderRadius: '8px',
        border: `1px solid ${statusConfig.borderColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#8b949e', fontSize: '14px' }}>#{task.id}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: statusConfig.bgColor,
            color: statusConfig.textColor,
            fontSize: '12px',
            fontWeight: 500,
          }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#c9d1d9', marginBottom: '8px' }}>
        {task.subject}
      </h3>

      {task.activeForm && task.status === 'in_progress' && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#d29922', fontSize: '14px' }}>
            {task.activeForm}
          </span>
        </div>
      )}

      {task.description && (
        <div style={{
          color: '#8b949e',
          fontSize: '14px',
          marginBottom: '12px',
          whiteSpace: 'pre-wrap',
          maxHeight: '100px',
          overflow: 'hidden',
        }}>
          {task.description}
        </div>
      )}

      {/* Dependencies */}
      {(task.blockedBy.length > 0 || task.blocks.length > 0) && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          {task.blockedBy.length > 0 && (
            <span style={{ color: '#8b949e' }}>
              Blocked by: <span style={{ color: '#f85149' }}>{task.blockedBy.join(', ')}</span>
            </span>
          )}
          {task.blocks.length > 0 && (
            <span style={{ color: '#8b949e' }}>
              Blocks: <span style={{ color: '#58a6ff' }}>{task.blocks.join(', ')}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusConfig(status: string): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  switch (status) {
    case 'in_progress':
      return {
        label: 'In Progress',
        bgColor: '#4d3800',
        textColor: '#d29922',
        borderColor: '#4d3800',
      };
    case 'completed':
      return {
        label: 'Completed',
        bgColor: '#1b4721',
        textColor: '#3fb950',
        borderColor: '#1b4721',
      };
    default:
      return {
        label: 'Pending',
        bgColor: '#21262d',
        textColor: '#8b949e',
        borderColor: '#30363d',
      };
  }
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

function NotFoundState({ conversationId }: { conversationId: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#8b949e',
      background: '#161b22',
      borderRadius: '8px',
      border: '1px solid #30363d',
    }}>
      <p style={{ marginBottom: '8px' }}>Task set not found</p>
      <p style={{ fontSize: '14px' }}>
        No tasks found for conversation: {conversationId}
      </p>
      <Link to="/tasks" style={{ color: '#58a6ff', marginTop: '16px', display: 'inline-block' }}>
        Back to Tasks
      </Link>
    </div>
  );
}
