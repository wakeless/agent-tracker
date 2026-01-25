import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { g as getTaskSummaries } from "./tasks-lsBLC6vG.js";
import "./createSsrRpc-CVg2UDl0.js";
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
function TasksListPage() {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTaskSummaries(),
    refetchInterval: 1e4
    // Poll every 10 seconds
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const {
    taskSets,
    total
  } = data || {
    taskSets: [],
    total: 0
  };
  const totals = taskSets.reduce((acc, ts) => ({
    pending: acc.pending + ts.pending,
    inProgress: acc.inProgress + ts.inProgress,
    completed: acc.completed + ts.completed
  }), {
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: {
      marginBottom: "24px"
    }, children: [
      /* @__PURE__ */ jsx("h2", { style: {
        color: "#c9d1d9",
        fontSize: "20px",
        marginBottom: "8px"
      }, children: "Task Explorer" }),
      /* @__PURE__ */ jsxs("p", { style: {
        color: "#8b949e",
        fontSize: "14px"
      }, children: [
        "Browse tasks from ~/.claude/tasks/ (",
        total,
        " conversations)"
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        gap: "16px",
        marginTop: "8px"
      }, children: [
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Pending: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#8b949e"
          }, children: totals.pending })
        ] }),
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Active: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#d29922"
          }, children: totals.inProgress })
        ] }),
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Done: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#3fb950"
          }, children: totals.completed })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(TaskSetsList, { taskSets })
  ] });
}
function TaskSetsList({
  taskSets
}) {
  if (taskSets.length === 0) {
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
      }, children: "No task sets found" }),
      /* @__PURE__ */ jsx("p", { style: {
        fontSize: "14px"
      }, children: "Tasks will appear here when created by Claude Code" })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }, children: taskSets.map((taskSet) => /* @__PURE__ */ jsx(TaskSetCard, { taskSet }, taskSet.conversationId)) });
}
function TaskSetCard({
  taskSet
}) {
  const timeAgo = formatTimeAgo(new Date(taskSet.lastModified));
  const truncatedId = taskSet.conversationId.substring(0, 8) + "...";
  return /* @__PURE__ */ jsxs(Link, { to: "/tasks/$conversationId", params: {
    conversationId: taskSet.conversationId
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
    e.currentTarget.style.borderColor = "#d29922";
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
        /* @__PURE__ */ jsx("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px"
        }, children: /* @__PURE__ */ jsxs("span", { style: {
          padding: "2px 8px",
          borderRadius: "12px",
          background: "#4d3800",
          color: "#d29922",
          fontSize: "12px",
          fontWeight: 500
        }, children: [
          taskSet.taskCount,
          " tasks"
        ] }) }),
        /* @__PURE__ */ jsxs("h3", { style: {
          fontSize: "16px",
          fontWeight: 500,
          color: "#c9d1d9"
        }, children: [
          "Conversation ",
          truncatedId
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#8b949e",
        fontSize: "13px"
      }, children: timeAgo })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      fontSize: "13px",
      color: "#8b949e",
      display: "flex",
      gap: "12px"
    }, children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#8b949e"
        }, children: taskSet.pending }),
        " pending"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#d29922"
        }, children: taskSet.inProgress }),
        " active"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("span", { style: {
          color: "#3fb950"
        }, children: taskSet.completed }),
        " done"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      marginTop: "8px"
    }, children: /* @__PURE__ */ jsx("code", { style: {
      background: "#0d1117",
      padding: "2px 6px",
      borderRadius: "4px",
      fontSize: "12px",
      color: "#8b949e"
    }, children: taskSet.conversationId }) })
  ] });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading tasks..." }) });
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
    }, children: "Error loading tasks" }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "14px",
      color: "#8b949e"
    }, children: error.message })
  ] });
}
function formatTimeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
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
  TasksListPage as component
};
