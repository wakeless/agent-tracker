import { createRootRoute, Outlet } from '@tanstack/react-router';
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
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Agent Tracker</h1>
              <p style={{ color: '#8b949e', fontSize: '14px' }}>Monitor Claude Code sessions in real-time</p>
            </header>
            <main>
              <Outlet />
            </main>
          </div>
        </body>
      </html>
    </QueryClientProvider>
  );
}
