import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { a as getTasksForConversation } from "./tasks-lsBLC6vG.js";
import { R as Route } from "./router-DS6JJFaw.js";
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
function TaskSetDetailPage() {
  const {
    conversationId
  } = Route.useParams();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["tasks", conversationId],
    queryFn: () => getTasksForConversation({
      data: conversationId
    }),
    refetchInterval: 5e3
    // Poll every 5 seconds for task updates
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const {
    taskSet
  } = data || {
    taskSet: null
  };
  if (!taskSet) {
    return /* @__PURE__ */ jsx(NotFoundState, { conversationId });
  }
  const counts = {
    pending: taskSet.tasks.filter((t) => t.status === "pending").length,
    inProgress: taskSet.tasks.filter((t) => t.status === "in_progress").length,
    completed: taskSet.tasks.filter((t) => t.status === "completed").length
  };
  const truncatedId = conversationId.substring(0, 12) + "...";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: {
      marginBottom: "16px"
    }, children: [
      /* @__PURE__ */ jsx(Link, { to: "/tasks", style: {
        color: "#58a6ff",
        textDecoration: "none"
      }, children: "Tasks" }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#8b949e",
        margin: "0 8px"
      }, children: "/" }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#c9d1d9"
      }, children: truncatedId })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      marginBottom: "24px"
    }, children: [
      /* @__PURE__ */ jsx("h2", { style: {
        color: "#c9d1d9",
        fontSize: "20px",
        marginBottom: "8px"
      }, children: "Task Set" }),
      /* @__PURE__ */ jsx("p", { style: {
        color: "#8b949e",
        fontSize: "14px",
        marginBottom: "8px"
      }, children: /* @__PURE__ */ jsx("code", { style: {
        background: "#0d1117",
        padding: "2px 6px",
        borderRadius: "4px"
      }, children: conversationId }) }),
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        gap: "16px"
      }, children: [
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Total: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#c9d1d9",
            fontWeight: 500
          }, children: taskSet.tasks.length })
        ] }),
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Pending: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#8b949e"
          }, children: counts.pending })
        ] }),
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Active: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#d29922"
          }, children: counts.inProgress })
        ] }),
        /* @__PURE__ */ jsxs("span", { style: {
          color: "#8b949e"
        }, children: [
          "Done: ",
          /* @__PURE__ */ jsx("span", { style: {
            color: "#3fb950"
          }, children: counts.completed })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(TasksList, { tasks: taskSet.tasks })
  ] });
}
function TasksList({
  tasks
}) {
  if (tasks.length === 0) {
    return /* @__PURE__ */ jsx("div", { style: {
      textAlign: "center",
      padding: "48px 24px",
      color: "#8b949e",
      background: "#161b22",
      borderRadius: "8px",
      border: "1px solid #30363d"
    }, children: /* @__PURE__ */ jsx("p", { children: "No tasks in this conversation" }) });
  }
  return /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }, children: tasks.map((task) => /* @__PURE__ */ jsx(TaskCard, { task }, task.id)) });
}
function TaskCard({
  task
}) {
  const statusConfig = getStatusConfig(task.status);
  return /* @__PURE__ */ jsxs("div", { style: {
    padding: "16px",
    background: "#161b22",
    borderRadius: "8px",
    border: `1px solid ${statusConfig.borderColor}`
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px"
    }, children: /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }, children: [
      /* @__PURE__ */ jsxs("span", { style: {
        color: "#8b949e",
        fontSize: "14px"
      }, children: [
        "#",
        task.id
      ] }),
      /* @__PURE__ */ jsx("span", { style: {
        padding: "2px 8px",
        borderRadius: "12px",
        background: statusConfig.bgColor,
        color: statusConfig.textColor,
        fontSize: "12px",
        fontWeight: 500
      }, children: statusConfig.label })
    ] }) }),
    /* @__PURE__ */ jsx("h3", { style: {
      fontSize: "16px",
      fontWeight: 500,
      color: "#c9d1d9",
      marginBottom: "8px"
    }, children: task.subject }),
    task.activeForm && task.status === "in_progress" && /* @__PURE__ */ jsx("div", { style: {
      marginBottom: "8px"
    }, children: /* @__PURE__ */ jsx("span", { style: {
      color: "#d29922",
      fontSize: "14px"
    }, children: task.activeForm }) }),
    task.description && /* @__PURE__ */ jsx("div", { style: {
      color: "#8b949e",
      fontSize: "14px",
      marginBottom: "12px",
      whiteSpace: "pre-wrap",
      maxHeight: "100px",
      overflow: "hidden"
    }, children: task.description }),
    (task.blockedBy.length > 0 || task.blocks.length > 0) && /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      gap: "16px",
      fontSize: "13px"
    }, children: [
      task.blockedBy.length > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#8b949e"
      }, children: [
        "Blocked by: ",
        /* @__PURE__ */ jsx("span", { style: {
          color: "#f85149"
        }, children: task.blockedBy.join(", ") })
      ] }),
      task.blocks.length > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#8b949e"
      }, children: [
        "Blocks: ",
        /* @__PURE__ */ jsx("span", { style: {
          color: "#58a6ff"
        }, children: task.blocks.join(", ") })
      ] })
    ] })
  ] });
}
function getStatusConfig(status) {
  switch (status) {
    case "in_progress":
      return {
        label: "In Progress",
        bgColor: "#4d3800",
        textColor: "#d29922",
        borderColor: "#4d3800"
      };
    case "completed":
      return {
        label: "Completed",
        bgColor: "#1b4721",
        textColor: "#3fb950",
        borderColor: "#1b4721"
      };
    default:
      return {
        label: "Pending",
        bgColor: "#21262d",
        textColor: "#8b949e",
        borderColor: "#30363d"
      };
  }
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
function NotFoundState({
  conversationId
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
      marginBottom: "8px"
    }, children: "Task set not found" }),
    /* @__PURE__ */ jsxs("p", { style: {
      fontSize: "14px"
    }, children: [
      "No tasks found for conversation: ",
      conversationId
    ] }),
    /* @__PURE__ */ jsx(Link, { to: "/tasks", style: {
      color: "#58a6ff",
      marginTop: "16px",
      display: "inline-block"
    }, children: "Back to Tasks" })
  ] });
}
export {
  TaskSetDetailPage as component
};
