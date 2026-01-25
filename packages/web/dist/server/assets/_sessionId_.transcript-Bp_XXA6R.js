import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { a as getSession, b as getTranscript } from "./sessions-B_9RbuyW.js";
import { useState, useCallback, useEffect } from "react";
import { b as Route } from "./router-BZOfhc0g.js";
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
function TranscriptPage() {
  const {
    sessionId
  } = Route.useParams();
  const [showSystemEntries, setShowSystemEntries] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const {
    data: sessionData,
    isLoading: sessionLoading
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession({
      data: sessionId
    })
  });
  const {
    data: transcriptData,
    isLoading: transcriptLoading
  } = useQuery({
    queryKey: ["transcript", sessionData?.session?.transcriptPath],
    queryFn: () => sessionData?.session?.transcriptPath ? getTranscript({
      data: sessionData.session.transcriptPath
    }) : Promise.resolve({
      entries: [],
      total: 0
    }),
    enabled: !!sessionData?.session?.transcriptPath,
    refetchInterval: 5e3
    // Poll for new entries
  });
  const handleKeyDown = useCallback((e) => {
    const entries = getFilteredEntries();
    if (entries.length === 0) return;
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => prev === null ? 0 : Math.min(prev + 1, entries.length - 1));
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => prev === null ? entries.length - 1 : Math.max(prev - 1, 0));
    } else if (e.key === "G") {
      e.preventDefault();
      setSelectedIndex(entries.length - 1);
    } else if (e.key === "g") {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === "s") {
      e.preventDefault();
      setShowSystemEntries((prev) => !prev);
    }
  }, [transcriptData]);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  useEffect(() => {
    if (selectedIndex !== null) {
      const element = document.getElementById(`entry-${selectedIndex}`);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [selectedIndex]);
  const getFilteredEntries = useCallback(() => {
    if (!transcriptData?.entries) return [];
    if (showSystemEntries) return transcriptData.entries;
    return transcriptData.entries.filter((entry) => entry.type !== "system" && entry.type !== "file-history" && entry.type !== "meta");
  }, [transcriptData, showSystemEntries]);
  if (sessionLoading || transcriptLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (!sessionData?.session) {
    return /* @__PURE__ */ jsx(NotFoundState, { sessionId });
  }
  const session = sessionData.session;
  const filteredEntries = getFilteredEntries();
  const displayName = session.displayName || session.cwd.split("/").pop() || "Unknown";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("nav", { style: {
      marginBottom: "16px"
    }, children: /* @__PURE__ */ jsx(Link, { to: "/sessions/$sessionId", params: {
      sessionId
    }, style: {
      color: "#58a6ff",
      fontSize: "14px"
    }, children: "Back to session" }) }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    }, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { style: {
          fontSize: "20px",
          fontWeight: 600,
          marginBottom: "4px"
        }, children: [
          displayName,
          " - Transcript"
        ] }),
        /* @__PURE__ */ jsxs("p", { style: {
          color: "#8b949e",
          fontSize: "14px"
        }, children: [
          filteredEntries.length,
          " entries",
          transcriptData && transcriptData.total !== filteredEntries.length && /* @__PURE__ */ jsxs("span", { children: [
            " (",
            transcriptData.total,
            " total)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setShowSystemEntries(!showSystemEntries), style: {
        padding: "6px 12px",
        borderRadius: "6px",
        background: showSystemEntries ? "#238636" : "#30363d",
        color: showSystemEntries ? "#3fb950" : "#8b949e",
        border: "none",
        cursor: "pointer",
        fontSize: "13px"
      }, children: [
        "System: ",
        showSystemEntries ? "ON" : "OFF"
      ] })
    ] }),
    filteredEntries.length === 0 ? /* @__PURE__ */ jsx(EmptyTranscript, {}) : /* @__PURE__ */ jsx("div", { style: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }, children: filteredEntries.map((entry, index) => /* @__PURE__ */ jsx(TranscriptEntry, { entry, index, isSelected: selectedIndex === index, onSelect: () => setSelectedIndex(index) }, entry.uuid)) }),
    /* @__PURE__ */ jsx("div", { style: {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#161b22",
      padding: "8px 16px",
      borderRadius: "8px",
      border: "1px solid #30363d",
      color: "#8b949e",
      fontSize: "13px"
    }, children: "j/k: Navigate | g/G: Top/Bottom | s: Toggle system entries" })
  ] });
}
function TranscriptEntry({
  entry,
  index,
  isSelected,
  onSelect
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  const getColor = () => {
    if (entry.type === "user") return "#58a6ff";
    if (entry.type === "tool_use") return "#f0883e";
    if (entry.type === "tool_result") return entry.isError ? "#f85149" : "#8b949e";
    if (entry.type === "thinking") return "#a371f7";
    if (entry.type === "system") return "#6e7681";
    if (entry.type === "file-history") return "#6e7681";
    if (entry.type === "meta") return "#6e7681";
    return "#3fb950";
  };
  const getLabel = () => {
    if (entry.type === "user") return "User";
    if (entry.type === "tool_use") return entry.toolName || "Tool Use";
    if (entry.type === "tool_result") return entry.isError ? "Tool Error" : "Tool Result";
    if (entry.type === "thinking") return "Thinking";
    if (entry.type === "system") return "System";
    if (entry.type === "file-history") return "File History";
    if (entry.type === "meta") return "Meta";
    return "Assistant";
  };
  const contentStr = typeof entry.content === "string" ? entry.content : JSON.stringify(entry.content, null, 2);
  const lines = contentStr.split("\n");
  const lineCount = lines.length;
  const displayContent = isExpanded ? contentStr : lines.slice(0, 3).join("\n");
  const hasMore = lineCount > 3;
  return /* @__PURE__ */ jsxs("div", { id: `entry-${index}`, onClick: onSelect, onDoubleClick: () => setIsExpanded(!isExpanded), style: {
    padding: "12px 16px",
    background: "#161b22",
    borderRadius: "8px",
    border: `1px solid ${isSelected ? "#58a6ff" : "#30363d"}`,
    cursor: "pointer",
    transition: "border-color 0.2s"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "8px"
    }, children: [
      isSelected && /* @__PURE__ */ jsx("span", { style: {
        color: "#58a6ff"
      }, children: ">" }),
      /* @__PURE__ */ jsxs("span", { style: {
        color: "#6e7681",
        fontSize: "13px"
      }, children: [
        "[",
        index + 1,
        "] ",
        formatTime(entry.timestamp)
      ] }),
      /* @__PURE__ */ jsx("span", { style: {
        padding: "2px 8px",
        borderRadius: "4px",
        background: `${getColor()}22`,
        color: getColor(),
        fontSize: "12px",
        fontWeight: 500
      }, children: getLabel() }),
      lineCount > 1 && /* @__PURE__ */ jsxs("span", { style: {
        color: "#6e7681",
        fontSize: "12px"
      }, children: [
        "(",
        lineCount,
        " lines)"
      ] }),
      hasMore && !isExpanded && /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681",
        fontSize: "12px"
      }, children: "[collapsed]" })
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      marginLeft: "16px"
    }, children: entry.type === "tool_use" && entry.toolInput ? /* @__PURE__ */ jsx(ToolContent, { toolName: entry.toolName || "Tool", toolInput: entry.toolInput, isExpanded }) : /* @__PURE__ */ jsxs("pre", { style: {
      margin: 0,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "13px",
      fontFamily: "monospace",
      color: "#c9d1d9"
    }, children: [
      displayContent,
      hasMore && !isExpanded && /* @__PURE__ */ jsxs("span", { style: {
        color: "#6e7681"
      }, children: [
        "\n",
        "..."
      ] })
    ] }) }),
    hasMore && /* @__PURE__ */ jsx("button", { onClick: (e) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }, style: {
      marginTop: "8px",
      marginLeft: "16px",
      background: "none",
      border: "none",
      color: "#58a6ff",
      cursor: "pointer",
      fontSize: "13px"
    }, children: isExpanded ? "Collapse" : "Expand" })
  ] });
}
function ToolContent({
  toolName,
  toolInput,
  isExpanded
}) {
  if (toolName === "Bash" && typeof toolInput.command === "string") {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("code", { style: {
        display: "block",
        background: "#0d1117",
        padding: "8px",
        borderRadius: "4px",
        fontSize: "13px",
        color: "#f0883e"
      }, children: [
        "$ ",
        toolInput.command
      ] }),
      toolInput.description && /* @__PURE__ */ jsx("p", { style: {
        color: "#8b949e",
        fontSize: "12px",
        marginTop: "4px"
      }, children: String(toolInput.description) })
    ] });
  }
  if ((toolName === "Read" || toolName === "Glob" || toolName === "Grep") && toolInput.file_path) {
    return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("code", { style: {
      display: "block",
      background: "#0d1117",
      padding: "8px",
      borderRadius: "4px",
      fontSize: "13px",
      color: "#58a6ff"
    }, children: String(toolInput.file_path) }) });
  }
  if (toolName === "Edit" && toolInput.file_path) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("code", { style: {
        display: "block",
        background: "#0d1117",
        padding: "8px",
        borderRadius: "4px",
        fontSize: "13px",
        color: "#3fb950"
      }, children: [
        "Editing: ",
        String(toolInput.file_path)
      ] }),
      isExpanded && toolInput.old_string && /* @__PURE__ */ jsxs("div", { style: {
        marginTop: "8px"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          color: "#f85149",
          fontSize: "12px",
          marginBottom: "4px"
        }, children: "- Old:" }),
        /* @__PURE__ */ jsx("pre", { style: {
          background: "#1c1210",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#f85149",
          margin: 0
        }, children: String(toolInput.old_string) }),
        /* @__PURE__ */ jsx("div", { style: {
          color: "#3fb950",
          fontSize: "12px",
          marginTop: "8px",
          marginBottom: "4px"
        }, children: "+ New:" }),
        /* @__PURE__ */ jsx("pre", { style: {
          background: "#0e1a10",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#3fb950",
          margin: 0
        }, children: String(toolInput.new_string) })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx("pre", { style: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#8b949e",
    background: "#0d1117",
    padding: "8px",
    borderRadius: "4px"
  }, children: isExpanded ? JSON.stringify(toolInput, null, 2) : JSON.stringify(toolInput, null, 2).slice(0, 200) + "..." });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading transcript..." }) });
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
    }, children: "Back to sessions" })
  ] });
}
function EmptyTranscript() {
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
    }, children: "No transcript entries yet" }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "14px"
    }, children: "Start interacting with the Claude session to see the transcript here" })
  ] });
}
export {
  TranscriptPage as component
};
