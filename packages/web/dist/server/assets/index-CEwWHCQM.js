import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { g as getSessions } from "./sessions-ZQQJR4wt.js";
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
function SessionListPage() {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getSessions(),
    refetchInterval: 5e3
    // Poll every 5 seconds for updates
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const {
    sessions,
    counts
  } = data || {
    sessions: [],
    counts: {
      total: 0,
      active: 0,
      inactive: 0,
      ended: 0,
      awaitingInput: 0
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(SessionCounts, { counts }),
    /* @__PURE__ */ jsx(SessionList, { sessions })
  ] });
}
function SessionCounts({
  counts
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  }, children: [
    /* @__PURE__ */ jsx(CountBadge, { label: "Total", count: counts.total, color: "#8b949e" }),
    /* @__PURE__ */ jsx(CountBadge, { label: "Active", count: counts.active, color: "#3fb950" }),
    /* @__PURE__ */ jsx(CountBadge, { label: "Awaiting Input", count: counts.awaitingInput, color: "#f0883e" }),
    /* @__PURE__ */ jsx(CountBadge, { label: "Inactive", count: counts.inactive, color: "#8b949e" }),
    /* @__PURE__ */ jsx(CountBadge, { label: "Ended", count: counts.ended, color: "#f85149" })
  ] });
}
function CountBadge({
  label,
  count,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#161b22",
    borderRadius: "6px",
    border: "1px solid #30363d"
  }, children: [
    /* @__PURE__ */ jsx("span", { style: {
      color: "#8b949e",
      fontSize: "13px"
    }, children: label }),
    /* @__PURE__ */ jsx("span", { style: {
      color,
      fontWeight: 600,
      fontSize: "16px"
    }, children: count })
  ] });
}
function SessionList({
  sessions
}) {
  if (sessions.length === 0) {
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
      }, children: "No sessions found" }),
      /* @__PURE__ */ jsx("p", { style: {
        fontSize: "14px"
      }, children: "Start a Claude Code session to see it here" })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }, children: sessions.map((session) => /* @__PURE__ */ jsx(SessionCard, { session }, session.id)) });
}
function SessionCard({
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
  const timeAgo = formatTimeAgo(session.lastActivityTime);
  const displayName = session.displayName || session.cwd.split("/").pop() || "Unknown";
  return /* @__PURE__ */ jsxs(Link, { to: "/sessions/$sessionId", params: {
    sessionId: session.id
  }, style: {
    display: "block",
    padding: "16px",
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.2s"
  }, onMouseOver: (e) => {
    e.currentTarget.style.borderColor = "#58a6ff";
  }, onMouseOut: (e) => {
    e.currentTarget.style.borderColor = "#30363d";
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px"
        }, children: [
          /* @__PURE__ */ jsx("span", { style: {
            padding: "2px 8px",
            borderRadius: "12px",
            background: bg,
            color: text,
            fontSize: "12px",
            fontWeight: 500
          }, children: session.status }),
          session.awaitingInput && /* @__PURE__ */ jsx("span", { style: {
            padding: "2px 8px",
            borderRadius: "12px",
            background: "#9e6a03",
            color: "#f0883e",
            fontSize: "12px",
            fontWeight: 500
          }, children: "awaiting input" })
        ] }),
        /* @__PURE__ */ jsx("h3", { style: {
          fontSize: "16px",
          fontWeight: 500,
          color: "#c9d1d9"
        }, children: displayName })
      ] }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#8b949e",
        fontSize: "13px"
      }, children: timeAgo })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      fontSize: "13px",
      color: "#8b949e"
    }, children: /* @__PURE__ */ jsx("code", { style: {
      background: "#0d1117",
      padding: "2px 6px",
      borderRadius: "4px"
    }, children: session.cwd }) }),
    session.git?.branch && /* @__PURE__ */ jsxs("div", { style: {
      marginTop: "8px",
      fontSize: "13px",
      color: "#8b949e"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        color: "#58a6ff"
      }, children: "⎇" }),
      " ",
      session.git.branch
    ] })
  ] });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading sessions..." }) });
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
    }, children: "Error loading sessions" }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "14px",
      color: "#8b949e"
    }, children: error.message })
  ] });
}
function formatTimeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1e3);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
export {
  SessionListPage as component
};
