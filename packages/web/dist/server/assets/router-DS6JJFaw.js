import { createRootRoute, useLocation, HeadContent, Link, Outlet, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
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
const Route$7 = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" }
    ]
  })
});
function RootComponent() {
  const location = useLocation();
  const isPlansSection = location.pathname.startsWith("/plans");
  const isTasksSection = location.pathname.startsWith("/tasks");
  const isSessionsSection = location.pathname === "/" || location.pathname.startsWith("/sessions");
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
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
            /* @__PURE__ */ jsx("h1", { style: { fontSize: "24px", fontWeight: 600 }, children: "Agent Tracker" }),
            /* @__PURE__ */ jsxs("nav", { style: { display: "flex", gap: "4px" }, children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/",
                  style: {
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: isSessionsSection ? "#21262d" : "transparent",
                    color: isSessionsSection ? "#c9d1d9" : "#8b949e",
                    border: "1px solid transparent",
                    textDecoration: "none"
                  },
                  children: "Sessions"
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/plans",
                  style: {
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: isPlansSection ? "#21262d" : "transparent",
                    color: isPlansSection ? "#c9d1d9" : "#8b949e",
                    border: "1px solid transparent",
                    textDecoration: "none"
                  },
                  children: "Plans"
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/tasks",
                  style: {
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: isTasksSection ? "#21262d" : "transparent",
                    color: isTasksSection ? "#c9d1d9" : "#8b949e",
                    border: "1px solid transparent",
                    textDecoration: "none"
                  },
                  children: "Tasks"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { color: "#8b949e", fontSize: "14px" }, children: "Monitor Claude Code sessions in real-time" })
        ] }),
        /* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsx(Outlet, {}) })
      ] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] }) });
}
const $$splitComponentImporter$6 = () => import("./index-C1UocdMY.js");
const Route$6 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./index-CG-kV1rO.js");
const Route$5 = createFileRoute("/tasks/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./index-DO36fpTI.js");
const Route$4 = createFileRoute("/plans/")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./_conversationId-BBTQKjXq.js");
const Route$3 = createFileRoute("/tasks/$conversationId")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./_sessionId-CTJqkfJ2.js");
const Route$2 = createFileRoute("/sessions/$sessionId")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./_filename-TwHZtD9T.js");
const Route$1 = createFileRoute("/plans/$filename")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./_sessionId_.transcript-CRg-l1CN.js");
const Route = createFileRoute("/sessions/$sessionId_/transcript")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$6.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$7
});
const TasksIndexRoute = Route$5.update({
  id: "/tasks/",
  path: "/tasks/",
  getParentRoute: () => Route$7
});
const PlansIndexRoute = Route$4.update({
  id: "/plans/",
  path: "/plans/",
  getParentRoute: () => Route$7
});
const TasksConversationIdRoute = Route$3.update({
  id: "/tasks/$conversationId",
  path: "/tasks/$conversationId",
  getParentRoute: () => Route$7
});
const SessionsSessionIdRoute = Route$2.update({
  id: "/sessions/$sessionId",
  path: "/sessions/$sessionId",
  getParentRoute: () => Route$7
});
const PlansFilenameRoute = Route$1.update({
  id: "/plans/$filename",
  path: "/plans/$filename",
  getParentRoute: () => Route$7
});
const SessionsSessionIdTranscriptRoute = Route.update({
  id: "/sessions/$sessionId_/transcript",
  path: "/sessions/$sessionId/transcript",
  getParentRoute: () => Route$7
});
const rootRouteChildren = {
  IndexRoute,
  PlansFilenameRoute,
  SessionsSessionIdRoute,
  TasksConversationIdRoute,
  PlansIndexRoute,
  TasksIndexRoute,
  SessionsSessionIdTranscriptRoute
};
const routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
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
  Route$3 as R,
  Route$2 as a,
  Route$1 as b,
  Route as c,
  router as r
};
