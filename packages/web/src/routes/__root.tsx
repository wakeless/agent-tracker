import { createRootRoute, Outlet, HeadContent, Scripts, Link, useLocation } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: true,
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  }),
});

function RootComponent() {
  const location = useLocation();
  const isPlansSection = location.pathname.startsWith('/plans');
  const isTasksSection = location.pathname.startsWith('/tasks');
  const isSessionsSection = location.pathname === '/' || location.pathname.startsWith('/sessions');

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
          <head>
            <HeadContent />
            <title>Agent Tracker</title>
            <style>{`
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: #0d1117;
                color: #c9d1d9;
                min-height: 100vh;
              }
              a { color: #58a6ff; text-decoration: none; }
              a:hover { text-decoration: underline; }
            `}</style>
          </head>
          <body>
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
              <header style={{ marginBottom: '24px', borderBottom: '1px solid #30363d', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Agent Tracker</h1>
                  <nav style={{ display: 'flex', gap: '4px' }}>
                    <Link
                      to="/"
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        background: isSessionsSection ? '#21262d' : 'transparent',
                        color: isSessionsSection ? '#c9d1d9' : '#8b949e',
                        border: '1px solid transparent',
                        textDecoration: 'none',
                      }}
                    >
                      Sessions
                    </Link>
                    <Link
                      to="/plans"
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        background: isPlansSection ? '#21262d' : 'transparent',
                        color: isPlansSection ? '#c9d1d9' : '#8b949e',
                        border: '1px solid transparent',
                        textDecoration: 'none',
                      }}
                    >
                      Plans
                    </Link>
                    <Link
                      to="/tasks"
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        background: isTasksSection ? '#21262d' : 'transparent',
                        color: isTasksSection ? '#c9d1d9' : '#8b949e',
                        border: '1px solid transparent',
                        textDecoration: 'none',
                      }}
                    >
                      Tasks
                    </Link>
                  </nav>
                </div>
                <p style={{ color: '#8b949e', fontSize: '14px' }}>Monitor Claude Code sessions in real-time</p>
              </header>
              <main>
                <Outlet />
              </main>
            </div>
            <Scripts />
          </body>
        </html>
    </QueryClientProvider>
  );
}
