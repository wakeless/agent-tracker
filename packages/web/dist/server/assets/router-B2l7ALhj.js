import { createRootRoute, HeadContent, Outlet, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5e3,
      refetchOnWindowFocus: true
    }
  }
});
const Route$3 = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" }
    ]
  })
});
function RootComponent() {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx(HeadContent, {}),
      /* @__PURE__ */ jsx("title", { children: "Agent Tracker" }),
      /* @__PURE__ */ jsx("style", { children: `
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: #0d1117;
                color: #c9d1d9;
                min-height: 100vh;
              }
              a { color: #58a6ff; text-decoration: none; }
              a:hover { text-decoration: underline; }
            ` })
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsxs("div", { style: { padding: "20px", maxWidth: "1200px", margin: "0 auto" }, children: [
        /* @__PURE__ */ jsxs("header", { style: { marginBottom: "24px", borderBottom: "1px solid #30363d", paddingBottom: "16px" }, children: [
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "24px", fontWeight: 600 }, children: "Agent Tracker" }),
          /* @__PURE__ */ jsx("p", { style: { color: "#8b949e", fontSize: "14px" }, children: "Monitor Claude Code sessions in real-time" })
        ] }),
        /* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsx(Outlet, {}) })
      ] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] }) });
}
const $$splitComponentImporter$2 = () => import("./index-CEwWHCQM.js");
const Route$2 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./_sessionId-Dg_Rpzfd.js");
const Route$1 = createFileRoute("/sessions/$sessionId")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./_sessionId.transcript-D04pAgUN.js");
const Route = createFileRoute("/sessions/$sessionId/transcript")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3
});
const SessionsSessionIdRoute = Route$1.update({
  id: "/sessions/$sessionId",
  path: "/sessions/$sessionId",
  getParentRoute: () => Route$3
});
const SessionsSessionIdTranscriptRoute = Route.update({
  id: "/transcript",
  path: "/transcript",
  getParentRoute: () => SessionsSessionIdRoute
});
const SessionsSessionIdRouteChildren = {
  SessionsSessionIdTranscriptRoute
};
const SessionsSessionIdRouteWithChildren = SessionsSessionIdRoute._addFileChildren(SessionsSessionIdRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  SessionsSessionIdRoute: SessionsSessionIdRouteWithChildren
};
const routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    defaultPreload: "intent"
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$1 as R,
  Route as a,
  router as r
};
