import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { a as getSession } from "./sessions-ZQQJR4wt.js";
import { R as Route } from "./router-B2l7ALhj.js";
import "../server.js";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core";
import "node:async_hooks";
import "@tanstack/router-core/ssr/server";
import "h3-v2";
import "tiny-invariant";
import "seroval";
import "@tanstack/react-router/ssr/server";
function SessionDetailPage() {
  const {
    sessionId
  } = Route.useParams();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    refetchInterval: 5e3
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const {
    session
  } = data || {
    session: null
  };
  if (!session) {
    return /* @__PURE__ */ jsx(NotFoundState, { sessionId });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("nav", { style: {
      marginBottom: "24px"
    }, children: /* @__PURE__ */ jsx(Link, { to: "/", style: {
      color: "#58a6ff",
      fontSize: "14px"
    }, children: "← Back to sessions" }) }),
    /* @__PURE__ */ jsx(SessionHeader, { session }),
    /* @__PURE__ */ jsx(SessionDetails, { session })
  ] });
}
function SessionHeader({
  session
}) {
  const statusColors = {
    active: {
      bg: "#238636",
      text: "#3fb950"
    },
    inactive: {
      bg: "#30363d",
      text: "#8b949e"
    },
    ended: {
      bg: "#da3633",
      text: "#f85149"
    }
  };
  const {
    bg,
    text
  } = statusColors[session.status] || statusColors.inactive;
  const displayName = session.displayName || session.cwd.split("/").pop() || "Unknown";
  return /* @__PURE__ */ jsxs("div", { style: {
    padding: "24px",
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
    marginBottom: "24px"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        padding: "4px 12px",
        borderRadius: "16px",
        background: bg,
        color: text,
        fontSize: "14px",
        fontWeight: 500
      }, children: session.status }),
      session.awaitingInput && /* @__PURE__ */ jsx("span", { style: {
        padding: "4px 12px",
        borderRadius: "16px",
        background: "#9e6a03",
        color: "#f0883e",
        fontSize: "14px",
        fontWeight: 500
      }, children: "awaiting input" })
    ] }),
    /* @__PURE__ */ jsx("h2", { style: {
      fontSize: "20px",
      fontWeight: 600,
      marginBottom: "8px"
    }, children: displayName }),
    /* @__PURE__ */ jsxs("p", { style: {
      color: "#8b949e",
      fontSize: "14px"
    }, children: [
      "Session ID: ",
      /* @__PURE__ */ jsx("code", { style: {
        background: "#0d1117",
        padding: "2px 6px",
        borderRadius: "4px"
      }, children: session.id })
    ] })
  ] });
}
function SessionDetails({
  session
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
  }, children: [
    /* @__PURE__ */ jsx(DetailCard, { title: "Working Directory", children: /* @__PURE__ */ jsx("code", { style: {
      wordBreak: "break-all"
    }, children: session.cwd }) }),
    session.git?.branch && /* @__PURE__ */ jsx(DetailCard, { title: "Git Information", children: /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: "Branch: " }),
        /* @__PURE__ */ jsx("span", { style: {
          color: "#58a6ff"
        }, children: session.git.branch })
      ] }),
      session.git.repo_name && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: "Repository: " }),
        /* @__PURE__ */ jsx("span", { children: session.git.repo_name })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(DetailCard, { title: "Timestamps", children: /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontSize: "14px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: "Started: " }),
        /* @__PURE__ */ jsx("span", { children: formatDate(session.startTime) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: "Last Activity: " }),
        /* @__PURE__ */ jsx("span", { children: formatDate(session.lastActivityTime) })
      ] }),
      session.endTime && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: "Ended: " }),
        /* @__PURE__ */ jsx("span", { children: formatDate(session.endTime) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(DetailCard, { title: "Transcript", children: /* @__PURE__ */ jsxs("div", { style: {
      fontSize: "14px"
    }, children: [
      /* @__PURE__ */ jsx("code", { style: {
        wordBreak: "break-all",
        color: "#8b949e",
        display: "block",
        marginBottom: "12px"
      }, children: session.transcriptPath }),
      /* @__PURE__ */ jsx(Link, { to: "/sessions/$sessionId/transcript", params: {
        sessionId: session.id
      }, style: {
        display: "inline-block",
        padding: "8px 16px",
        background: "#238636",
        color: "#ffffff",
        borderRadius: "6px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 500
      }, children: "View Transcript" })
    ] }) })
  ] });
}
function DetailCard({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    padding: "16px",
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d"
  }, children: [
    /* @__PURE__ */ jsx("h3", { style: {
      fontSize: "14px",
      fontWeight: 500,
      color: "#8b949e",
      marginBottom: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }, children: title }),
    /* @__PURE__ */ jsx("div", { style: {
      color: "#c9d1d9"
    }, children })
  ] });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading session..." }) });
}
function ErrorState({
  error
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#f85149",
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #da3633"
  }, children: [
    /* @__PURE__ */ jsx("p", { style: {
      marginBottom: "8px"
    }, children: "Error loading session" }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "14px",
      color: "#8b949e"
    }, children: error.message })
  ] });
}
function NotFoundState({
  sessionId
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e",
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d"
  }, children: [
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "16px",
      marginBottom: "8px"
    }, children: "Session not found" }),
    /* @__PURE__ */ jsxs("p", { style: {
      fontSize: "14px"
    }, children: [
      "Session ",
      sessionId,
      " may have ended or been removed"
    ] }),
    /* @__PURE__ */ jsx(Link, { to: "/", style: {
      display: "inline-block",
      marginTop: "16px"
    }, children: "← Back to sessions" })
  ] });
}
function formatDate(date) {
  return new Date(date).toLocaleString();
}
export {
  SessionDetailPage as component
};
