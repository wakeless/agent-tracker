import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { a as getPlan } from "./plans-CYP-uASm.js";
import { b as Route } from "./router-DS6JJFaw.js";
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
function PlanDetailPage() {
  const {
    filename
  } = Route.useParams();
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["plan", filename],
    queryFn: () => getPlan({
      data: filename
    })
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx(LoadingState, {});
  }
  if (error) {
    return /* @__PURE__ */ jsx(ErrorState, { error });
  }
  const parsedPlan = data?.parsed;
  if (!data?.content || !parsedPlan) {
    return /* @__PURE__ */ jsx(NotFoundState, { filename });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
      flexWrap: "wrap"
    }, children: [
      /* @__PURE__ */ jsx(Link, { to: "/plans", style: {
        color: "#a371f7",
        fontSize: "13px"
      }, children: "← Plans" }),
      /* @__PURE__ */ jsx("span", { style: {
        color: "#a371f7",
        fontSize: "12px"
      }, children: "●" }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "14px",
        fontWeight: 500,
        color: "#c9d1d9"
      }, children: parsedPlan.title })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      padding: "12px 16px",
      marginBottom: "16px",
      background: "#161b22",
      borderRadius: "8px",
      border: "1px solid #30363d",
      fontSize: "13px",
      color: "#8b949e"
    }, children: [
      /* @__PURE__ */ jsx("code", { style: {
        background: "#0d1117",
        padding: "2px 6px",
        borderRadius: "4px"
      }, children: filename }),
      /* @__PURE__ */ jsxs("span", { style: {
        marginLeft: "12px"
      }, children: [
        parsedPlan.sections.length,
        " sections"
      ] })
    ] }),
    /* @__PURE__ */ jsx(PlanSections, { sections: parsedPlan.sections })
  ] });
}
function PlanSections({
  sections
}) {
  const [expandedSections, setExpandedSections] = useState(/* @__PURE__ */ new Set());
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  const expandAll = () => {
    setExpandedSections(new Set(sections.map((s) => s.id)));
  };
  const collapseAll = () => {
    setExpandedSections(/* @__PURE__ */ new Set());
  };
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      padding: "8px 12px",
      borderBottom: "1px solid #30363d",
      display: "flex",
      gap: "8px",
      alignItems: "center"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "13px",
        color: "#8b949e",
        marginRight: "auto"
      }, children: "Sections" }),
      /* @__PURE__ */ jsx("button", { onClick: expandAll, style: {
        padding: "4px 10px",
        borderRadius: "4px",
        border: "1px solid #30363d",
        background: "#21262d",
        color: "#8b949e",
        fontSize: "12px",
        cursor: "pointer"
      }, children: "Expand all" }),
      /* @__PURE__ */ jsx("button", { onClick: collapseAll, style: {
        padding: "4px 10px",
        borderRadius: "4px",
        border: "1px solid #30363d",
        background: "#21262d",
        color: "#8b949e",
        fontSize: "12px",
        cursor: "pointer"
      }, children: "Collapse all" })
    ] }),
    sections.length === 0 ? /* @__PURE__ */ jsx("div", { style: {
      padding: "32px",
      textAlign: "center",
      color: "#6e7681"
    }, children: "No sections found" }) : sections.map((section, index) => /* @__PURE__ */ jsx(PlanSectionItem, { section, index, totalSections: sections.length, isExpanded: expandedSections.has(section.id), onToggle: () => toggleSection(section.id) }, section.id))
  ] });
}
function PlanSectionItem({
  section,
  index,
  totalSections,
  isExpanded,
  onToggle
}) {
  return /* @__PURE__ */ jsxs("div", { style: {
    borderBottom: "1px solid #21262d"
  }, children: [
    /* @__PURE__ */ jsxs("button", { onClick: onToggle, style: {
      width: "100%",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      textAlign: "left"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: {
        color: "#6e7681",
        fontSize: "12px"
      }, children: isExpanded ? "▼" : "▶" }),
      /* @__PURE__ */ jsx("span", { style: {
        fontSize: "14px",
        fontWeight: 500,
        color: "#c9d1d9"
      }, children: section.title }),
      /* @__PURE__ */ jsxs("span", { style: {
        color: "#6e7681",
        fontSize: "12px",
        marginLeft: "auto"
      }, children: [
        "[",
        index + 1,
        "/",
        totalSections,
        "]"
      ] })
    ] }),
    isExpanded && /* @__PURE__ */ jsx("div", { style: {
      padding: "16px",
      paddingTop: "0",
      marginLeft: "24px"
    }, children: /* @__PURE__ */ jsx(MarkdownContent, { content: section.content, codeBlocks: section.codeBlocks }) })
  ] });
}
function MarkdownContent({
  content,
  codeBlocks
}) {
  const lines = content.split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBlockIndex = 0;
  let currentTextLines = [];
  let key = 0;
  const flushText = () => {
    if (currentTextLines.length > 0) {
      elements.push(/* @__PURE__ */ jsx("div", { style: {
        marginBottom: "8px"
      }, children: currentTextLines.map((line, i) => renderLine(line, i)) }, key++));
      currentTextLines = [];
    }
  };
  const renderLine = (line, lineKey) => {
    if (line.match(/^#{1,6}\s/)) {
      return /* @__PURE__ */ jsx("div", { style: {
        fontWeight: 600,
        color: "#c9d1d9",
        marginBottom: "4px"
      }, children: line.replace(/^#+\s*/, "") }, lineKey);
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return /* @__PURE__ */ jsxs("div", { style: {
        paddingLeft: "16px",
        color: "#c9d1d9"
      }, children: [
        "• ",
        line.slice(2)
      ] }, lineKey);
    }
    if (/^\d+\.\s/.test(line)) {
      return /* @__PURE__ */ jsx("div", { style: {
        paddingLeft: "16px",
        color: "#c9d1d9"
      }, children: line }, lineKey);
    }
    if (line.trim() === "") {
      return /* @__PURE__ */ jsx("div", { style: {
        height: "8px"
      } }, lineKey);
    }
    if (line.includes("|")) {
      return /* @__PURE__ */ jsx("div", { style: {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#8b949e"
      }, children: line }, lineKey);
    }
    return /* @__PURE__ */ jsx("div", { style: {
      color: "#c9d1d9"
    }, children: line }, lineKey);
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushText();
        if (codeBlocks[codeBlockIndex]) {
          const block = codeBlocks[codeBlockIndex];
          elements.push(/* @__PURE__ */ jsxs("div", { style: {
            margin: "8px 0",
            background: "#0d1117",
            borderRadius: "6px",
            border: "1px solid #30363d",
            overflow: "hidden"
          }, children: [
            /* @__PURE__ */ jsx("div", { style: {
              padding: "6px 12px",
              borderBottom: "1px solid #30363d",
              fontSize: "11px",
              color: "#8b949e"
            }, children: block.language || "code" }),
            /* @__PURE__ */ jsx("pre", { style: {
              margin: 0,
              padding: "12px",
              fontSize: "12px",
              color: "#c9d1d9",
              overflow: "auto"
            }, children: block.code })
          ] }, key++));
          codeBlockIndex++;
        }
      } else {
        inCodeBlock = true;
        flushText();
      }
    } else if (!inCodeBlock) {
      currentTextLines.push(line);
    }
  }
  flushText();
  return /* @__PURE__ */ jsx(Fragment, { children: elements });
}
function LoadingState() {
  return /* @__PURE__ */ jsx("div", { style: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#8b949e"
  }, children: /* @__PURE__ */ jsx("p", { children: "Loading plan..." }) });
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
    }, children: "Error loading plan" }),
    /* @__PURE__ */ jsx("p", { style: {
      fontSize: "14px",
      color: "#8b949e"
    }, children: error.message })
  ] });
}
function NotFoundState({
  filename
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
    }, children: "Plan not found" }),
    /* @__PURE__ */ jsxs("p", { style: {
      fontSize: "14px"
    }, children: [
      filename,
      " may have been deleted or moved"
    ] }),
    /* @__PURE__ */ jsx(Link, { to: "/plans", style: {
      display: "inline-block",
      marginTop: "16px"
    }, children: "← Back to plans" })
  ] });
}
export {
  PlanDetailPage as component
};
