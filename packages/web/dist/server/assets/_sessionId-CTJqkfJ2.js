import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect } from "react";
import { a as getSession, b as getTranscript } from "./sessions-B_9RbuyW.js";
import { a as Route } from "./router-DS6JJFaw.js";
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
const ENTRIES_PER_PAGE = 50;
function SessionDetailPage() {
  const {
    sessionId
  } = Route.useParams();
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession({
      data: sessionId
    }),
    refetchInterval: 5e3
  });
  const session = sessionData?.session;
  const {
    data: transcriptData,
    isLoading: transcriptLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["transcript", session?.transcriptPath],
    queryFn: async ({
      pageParam
    }) => {
      if (!session?.transcriptPath) {
        return {
          entries: [],
          total: 0,
          hasMore: false
        };
      }
      return getTranscript({
        data: {
          path: session.transcriptPath,
          limit: ENTRIES_PER_PAGE,
          before: pageParam
        }
      });
    },
    initialPageParam: void 0,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.oldestTimestamp : void 0,
    enabled: !!session?.transcriptPath,
    refetchInterval: 5e3
  });
  const allEntries = useMemo(() => {
    if (!transcriptData?.pages) return [];
    return transcriptData.pages.flatMap((page) => page.entries);
  }, [transcriptData]);
  const total = transcriptData?.pages[0]?.total || 0;
  if (sessionLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (sessionError) {
    return /* @__PURE__ */ jsx(ErrorState, { error: sessionError });
  }
  if (!session) {
    return /* @__PURE__ */ jsx(NotFoundState, { sessionId });
  }
  const displayName = session.displayName || session.cwd.split("/").pop() || "Unknown";
  const statusColors = {
    active: "#3fb950",
    inactive: "#8b949e",
    ended: "#f85149"
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
      flexWrap: "wrap"
    }, children: [
      /* @__PURE__ */ jsx(Link, { to: "/", style: {
        color: "#58a6ff",
        fontSize: "13px"
      }, children: "←" }),
      /* @__PURE__ */ jsx("span", { style: {
        color: statusColors[session.status] || "#8b949e",
        fontSize: "12px"
      }, children: "●" }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "14px",
        fontWeight: 500,
        color: "#c9d1d9"
      }, children: displayName }),
      session.awaitingInput && /* @__PURE__ */ jsx("span", { style: {
        padding: "2px 8px",
        borderRadius: "12px",
        background: "#9e6a03",
        color: "#f0883e",
        fontSize: "11px"
      }, children: "awaiting input" })
    ] }),
    /* @__PURE__ */ jsx(HighlightsSection, { entries: allEntries }),
    /* @__PURE__ */ jsx(TranscriptSection, { entries: allEntries, total, hasMore: hasNextPage || false, isLoading: transcriptLoading, isFetchingMore: isFetchingNextPage, onLoadMore: fetchNextPage })
  ] });
}
function extractHighlights(entries) {
  const highlights = [];
  for (const entry of entries) {
    if (entry.type === "tool_use" && entry.toolName === "Write") {
      const filePath = entry.toolInput?.file_path;
      if (filePath?.includes(".claude/plans") || filePath?.endsWith(".md")) {
        highlights.push({
          type: "plan",
          entry,
          summary: `Plan: ${filePath?.split("/").pop() || "unknown"}`
        });
      }
    }
    if (entry.type === "tool_use" && entry.toolName === "Task") {
      const description = entry.toolInput?.description;
      const subagentType = entry.toolInput?.subagent_type;
      highlights.push({
        type: "task",
        entry,
        summary: `${subagentType || "Agent"}: ${description || "task"}`
      });
    }
    if (entry.type === "tool_result" && entry.isError) {
      const content = typeof entry.content === "string" ? entry.content : JSON.stringify(entry.content);
      highlights.push({
        type: "error",
        entry,
        summary: content.slice(0, 100) + (content.length > 100 ? "..." : "")
      });
    }
    if (entry.type === "user") {
      const content = typeof entry.content === "string" ? entry.content : JSON.stringify(entry.content);
      highlights.push({
        type: "user",
        entry,
        summary: content.slice(0, 100) + (content.length > 100 ? "..." : "")
      });
    }
  }
  return highlights.reverse().slice(0, 20);
}
function HighlightsSection({
  entries
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const highlights = useMemo(() => extractHighlights(entries), [entries]);
  const filteredHighlights = useMemo(() => {
    if (activeTab === "all") return highlights;
    return highlights.filter((h) => h.type === activeTab.replace("s", ""));
  }, [highlights, activeTab]);
  const counts = useMemo(() => ({
    plans: highlights.filter((h) => h.type === "plan").length,
    tasks: highlights.filter((h) => h.type === "task").length,
    errors: highlights.filter((h) => h.type === "error").length,
    user: highlights.filter((h) => h.type === "user").length
  }), [highlights]);
  if (highlights.length === 0) return null;
  const getTypeColor = (type) => {
    switch (type) {
      case "plan":
        return "#a371f7";
      case "task":
        return "#f0883e";
      case "error":
        return "#f85149";
      case "user":
        return "#58a6ff";
    }
  };
  const getTypeLabel = (type) => {
    switch (type) {
      case "plan":
        return "Plan";
      case "task":
        return "Task";
      case "error":
        return "Error";
      case "user":
        return "User";
    }
  };
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  if (!isExpanded) {
    return /* @__PURE__ */ jsxs("button", { onClick: () => setIsExpanded(true), style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      width: "100%",
      padding: "8px 12px",
      marginBottom: "12px",
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "6px",
      cursor: "pointer",
      color: "#8b949e",
      fontSize: "12px"
    }, children: [
      /* @__PURE__ */ jsx("span", { children: "▶" }),
      /* @__PURE__ */ jsx("span", { children: "Highlights:" }),
      counts.plans > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#a371f7"
      }, children: [
        counts.plans,
        " plans"
      ] }),
      counts.tasks > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#f0883e"
      }, children: [
        counts.tasks,
        " tasks"
      ] }),
      counts.errors > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#f85149"
      }, children: [
        counts.errors,
        " errors"
      ] }),
      counts.user > 0 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#58a6ff"
      }, children: [
        counts.user,
        " user"
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
    marginBottom: "12px",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      padding: "8px 12px",
      borderBottom: "1px solid #30363d",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      flexWrap: "wrap"
    }, children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setIsExpanded(false), style: {
        background: "none",
        border: "none",
        color: "#8b949e",
        cursor: "pointer",
        padding: "2px",
        fontSize: "10px"
      }, children: "▼" }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "13px",
        fontWeight: 500,
        color: "#c9d1d9",
        marginRight: "4px"
      }, children: "Highlights" }),
      ["all", "plans", "tasks", "errors", "user"].map((tab) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveTab(tab), style: {
        padding: "4px 10px",
        borderRadius: "16px",
        border: "none",
        background: activeTab === tab ? "#30363d" : "transparent",
        color: activeTab === tab ? "#c9d1d9" : "#6e7681",
        fontSize: "12px",
        cursor: "pointer"
      }, children: tab === "all" ? `All (${highlights.length})` : tab === "plans" ? `Plans (${counts.plans})` : tab === "tasks" ? `Tasks (${counts.tasks})` : tab === "errors" ? `Errors (${counts.errors})` : `User (${counts.user})` }, tab))
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      maxHeight: "200px",
      overflowY: "auto"
    }, children: filteredHighlights.map((highlight, index) => /* @__PURE__ */ jsxs("div", { style: {
      padding: "8px 16px",
      borderBottom: "1px solid #21262d",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681",
        fontSize: "11px",
        minWidth: "50px"
      }, children: formatTime(highlight.entry.timestamp) }),
      /* @__PURE__ */ jsx("span", { style: {
        padding: "1px 6px",
        borderRadius: "4px",
        background: `${getTypeColor(highlight.type)}22`,
        color: getTypeColor(highlight.type),
        fontSize: "11px",
        fontWeight: 500,
        flexShrink: 0
      }, children: getTypeLabel(highlight.type) }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "12px",
        color: "#c9d1d9",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }, children: highlight.summary })
    ] }, highlight.entry.uuid || index)) })
  ] });
}
function TranscriptSection({
  entries,
  total,
  hasMore,
  isLoading,
  isFetchingMore,
  onLoadMore
}) {
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    const handleScroll = () => {
      if (isFetchingMore || !hasMore) return;
      const {
        scrollTop,
        scrollHeight,
        clientHeight
      } = scrollContainer;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        onLoadMore();
      }
    };
    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, onLoadMore]);
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      padding: "8px 12px",
      borderBottom: "1px solid #30363d",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }, children: /* @__PURE__ */ jsxs("span", { style: {
      fontSize: "13px",
      color: "#8b949e"
    }, children: [
      "Transcript",
      /* @__PURE__ */ jsxs("span", { style: {
        marginLeft: "8px"
      }, children: [
        entries.length,
        " of ",
        total
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { ref: scrollContainerRef, style: {
      height: "calc(100vh - 280px)",
      overflowY: "auto"
    }, children: isLoading ? /* @__PURE__ */ jsxs("div", { style: {
      padding: "32px",
      textAlign: "center",
      color: "#8b949e"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        marginBottom: "8px"
      }, children: "Loading transcript..." }),
      /* @__PURE__ */ jsx("div", { style: {
        width: "24px",
        height: "24px",
        border: "2px solid #30363d",
        borderTopColor: "#58a6ff",
        borderRadius: "50%",
        margin: "0 auto",
        animation: "spin 1s linear infinite"
      } }),
      /* @__PURE__ */ jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
    ] }) : entries.length === 0 ? /* @__PURE__ */ jsx("div", { style: {
      padding: "32px",
      textAlign: "center",
      color: "#6e7681"
    }, children: "No transcript entries yet" }) : /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      flexDirection: "column"
    }, children: [
      entries.map((entry, index) => /* @__PURE__ */ jsx(TranscriptEntry, { entry }, entry.uuid || index)),
      /* @__PURE__ */ jsx("div", { style: {
        padding: "16px",
        textAlign: "center"
      }, children: isFetchingMore ? /* @__PURE__ */ jsx("span", { style: {
        color: "#8b949e",
        fontSize: "12px"
      }, children: "Loading more..." }) : hasMore ? /* @__PURE__ */ jsx("button", { onClick: () => onLoadMore(), style: {
        padding: "6px 16px",
        background: "#21262d",
        border: "1px solid #30363d",
        borderRadius: "6px",
        color: "#58a6ff",
        fontSize: "12px",
        cursor: "pointer"
      }, children: "Load more" }) : entries.length > 0 ? /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681",
        fontSize: "12px"
      }, children: "End of transcript" }) : null })
    ] }) })
  ] });
}
function TranscriptEntry({
  entry
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const getColor = () => {
    if (entry.type === "user") return "#58a6ff";
    if (entry.type === "tool_use") return "#f0883e";
    if (entry.type === "tool_result") return entry.isError ? "#f85149" : "#8b949e";
    if (entry.type === "thinking") return "#a371f7";
    return "#3fb950";
  };
  const getLabel = () => {
    if (entry.type === "user") return "User";
    if (entry.type === "tool_use") return entry.toolName || "Tool";
    if (entry.type === "tool_result") return entry.isError ? "Error" : "Result";
    if (entry.type === "thinking") return "Think";
    return "Claude";
  };
  const contentStr = typeof entry.content === "string" ? entry.content : JSON.stringify(entry.content, null, 2);
  const lines = contentStr.split("\n");
  const displayContent = isExpanded ? contentStr : lines.slice(0, 3).join("\n");
  const hasMore = lines.length > 3;
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  return /* @__PURE__ */ jsxs("div", { onClick: () => hasMore && setIsExpanded(!isExpanded), style: {
    padding: "10px 16px",
    borderBottom: "1px solid #21262d",
    cursor: hasMore ? "pointer" : "default"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681",
        fontSize: "11px",
        minWidth: "50px"
      }, children: formatTime(entry.timestamp) }),
      /* @__PURE__ */ jsx("span", { style: {
        padding: "1px 6px",
        borderRadius: "4px",
        background: `${getColor()}22`,
        color: getColor(),
        fontSize: "11px",
        fontWeight: 500
      }, children: getLabel() }),
      hasMore && /* @__PURE__ */ jsxs("span", { style: {
        color: "#6e7681",
        fontSize: "11px"
      }, children: [
        "(",
        lines.length,
        " lines) ",
        isExpanded ? "▼" : "▶"
      ] })
    ] }),
    entry.type === "tool_use" && entry.toolName === "Bash" && entry.toolInput?.command ? /* @__PURE__ */ jsxs("code", { style: {
      display: "block",
      background: "#0d1117",
      padding: "6px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      color: "#f0883e",
      marginTop: "4px"
    }, children: [
      "$ ",
      String(entry.toolInput.command)
    ] }) : /* @__PURE__ */ jsxs("pre", { style: {
      margin: 0,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "12px",
      color: "#c9d1d9",
      lineHeight: 1.5
    }, children: [
      displayContent,
      hasMore && !isExpanded && /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681"
      }, children: "..." })
    ] })
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
export {
  SessionDetailPage as component
};
