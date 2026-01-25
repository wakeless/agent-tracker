import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { g as getPlans } from "./plans-CYP-uASm.js";
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
function PlansListPage() {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["plans"],
    queryFn: () => getPlans(),
    refetchInterval: 3e4
    // Poll every 30 seconds (plans don't change often)
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const {
    plans,
    total
  } = data || {
    plans: [],
    total: 0
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: {
      marginBottom: "24px"
    }, children: [
      /* @__PURE__ */ jsx("h2", { style: {
        color: "#c9d1d9",
        fontSize: "20px",
        marginBottom: "8px"
      }, children: "Plan Explorer" }),
      /* @__PURE__ */ jsxs("p", { style: {
        color: "#8b949e",
        fontSize: "14px"
      }, children: [
        "Browse plans from ~/.claude/plans/ (",
        total,
        " total)"
      ] })
    ] }),
    /* @__PURE__ */ jsx(PlansList, { plans })
  ] });
}
function PlansList({
  plans
}) {
  if (plans.length === 0) {
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
      }, children: "No plans found" }),
      /* @__PURE__ */ jsx("p", { style: {
        fontSize: "14px"
      }, children: "Plans will appear here when created by Claude Code" })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  }, children: plans.map((plan) => /* @__PURE__ */ jsx(PlanCard, { plan }, plan.filename)) });
}
function PlanCard({
  plan
}) {
  const timeAgo = formatTimeAgo(new Date(plan.modified));
  const size = formatSize(plan.size);
  return /* @__PURE__ */ jsxs(Link, { to: "/plans/$filename", params: {
    filename: plan.filename
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
    e.currentTarget.style.borderColor = "#a371f7";
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
        }, children: /* @__PURE__ */ jsx("span", { style: {
          padding: "2px 8px",
          borderRadius: "12px",
          background: "#553098",
          color: "#a371f7",
          fontSize: "12px",
          fontWeight: 500
        }, children: "plan" }) }),
        /* @__PURE__ */ jsx("h3", { style: {
          fontSize: "16px",
          fontWeight: 500,
          color: "#c9d1d9"
        }, children: plan.title })
      ] }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#8b949e",
        fontSize: "13px"
      }, children: timeAgo })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      fontSize: "13px",
      color: "#8b949e"
    }, children: [
      /* @__PURE__ */ jsx("code", { style: {
        background: "#0d1117",
        padding: "2px 6px",
        borderRadius: "4px"
      }, children: plan.filename }),
      /* @__PURE__ */ jsx("span", { style: {
        marginLeft: "8px"
      }, children: size })
    ] })
  ] });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading plans..." }) });
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
    }, children: "Error loading plans" }),
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
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
export {
  PlansListPage as component
};
