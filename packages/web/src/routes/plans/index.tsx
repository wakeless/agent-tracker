import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getPlans, PlansResponse } from '../../server/plans';

export const Route = createFileRoute('/plans/')({
  component: PlansListPage,
});

function PlansListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans(),
    refetchInterval: 30000, // Poll every 30 seconds (plans don't change often)
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error as Error} />;
  }

  const { plans, total } = data || { plans: [], total: 0 };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#c9d1d9', fontSize: '20px', marginBottom: '8px' }}>
          Plan Explorer
        </h2>
        <p style={{ color: '#8b949e', fontSize: '14px' }}>
          Browse plans from ~/.claude/plans/ ({total} total)
        </p>
      </div>
      <PlansList plans={plans} />
    </div>
  );
}

interface SerializedPlanFile {
  filename: string;
  path: string;
  title: string;
  modified: string;
  size: number;
}

function PlansList({ plans }: { plans: SerializedPlanFile[] }) {
  if (plans.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: '#8b949e',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px solid #30363d',
      }}>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>No plans found</p>
        <p style={{ fontSize: '14px' }}>Plans will appear here when created by Claude Code</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {plans.map((plan) => (
        <PlanCard key={plan.filename} plan={plan} />
      ))}
    </div>
  );
}

function PlanCard({ plan }: { plan: SerializedPlanFile }) {
  const timeAgo = formatTimeAgo(new Date(plan.modified));
  const size = formatSize(plan.size);

  return (
    <Link
      to="/plans/$filename"
      params={{ filename: plan.filename }}
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
        (e.currentTarget as HTMLElement).style.borderColor = '#a371f7';
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
              background: '#553098',
              color: '#a371f7',
              fontSize: '12px',
              fontWeight: 500,
            }}>
              plan
            </span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#c9d1d9' }}>
            {plan.title}
          </h3>
        </div>
        <span style={{ color: '#8b949e', fontSize: '13px' }}>{timeAgo}</span>
      </div>
      <div style={{ fontSize: '13px', color: '#8b949e' }}>
        <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>
          {plan.filename}
        </code>
        <span style={{ marginLeft: '8px' }}>{size}</span>
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
      <p>Loading plans...</p>
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
      <p style={{ marginBottom: '8px' }}>Error loading plans</p>
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
