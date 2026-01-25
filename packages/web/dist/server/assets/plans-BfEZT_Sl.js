import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { c as createServerFn } from "../server.js";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core";
import "node:async_hooks";
import "@tanstack/router-core/ssr/server";
import "h3-v2";
import "tiny-invariant";
import "seroval";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
class PlanReader {
  plansDir;
  enableLogging;
  constructor(options = {}) {
    this.plansDir = options.plansDir || path.join(homedir(), ".claude", "plans");
    this.enableLogging = options.enableLogging ?? false;
  }
  log(...args) {
    if (this.enableLogging) {
      console.log("[PlanReader]", ...args);
    }
  }
  /**
   * Extract title from markdown content by finding the first H1 heading.
   * Returns the filename (without .md) if no H1 is found.
   */
  extractTitle(content, filename) {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      let title = match[1].trim();
      if (title.toLowerCase().startsWith("plan:")) {
        title = title.substring(5).trim();
      }
      return title;
    }
    return filename.replace(/\.md$/i, "");
  }
  /**
   * Check if the plans directory exists
   */
  plansExist() {
    return fs.existsSync(this.plansDir);
  }
  /**
   * Scan the plans directory and return metadata for all plan files
   */
  scanPlans() {
    const plans = [];
    if (!this.plansExist()) {
      this.log("Plans directory does not exist:", this.plansDir);
      return plans;
    }
    try {
      const files = fs.readdirSync(this.plansDir, { withFileTypes: true });
      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".md")) {
          continue;
        }
        const filePath = path.join(this.plansDir, file.name);
        try {
          const stats = fs.statSync(filePath);
          const fd = fs.openSync(filePath, "r");
          const buffer = Buffer.alloc(1024);
          const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
          fs.closeSync(fd);
          const headerContent = buffer.toString("utf-8", 0, bytesRead);
          const title = this.extractTitle(headerContent, file.name);
          plans.push({
            filename: file.name,
            path: filePath,
            title,
            modified: stats.mtime,
            size: stats.size
          });
        } catch (err) {
          this.log("Error reading plan file:", filePath, err);
        }
      }
    } catch (err) {
      this.log("Error scanning plans directory:", err);
    }
    plans.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    this.log(`Found ${plans.length} plan files`);
    return plans;
  }
  /**
   * Read the full content of a plan file
   * @param filename The filename (not full path) of the plan to read
   * @returns The file content as a string, or null if not found
   */
  readPlan(filename) {
    const sanitized = path.basename(filename);
    const filePath = path.join(this.plansDir, sanitized);
    if (!fs.existsSync(filePath)) {
      this.log("Plan file not found:", filePath);
      return null;
    }
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      this.log("Error reading plan file:", filePath, err);
      return null;
    }
  }
  /**
   * Get the plans directory path
   */
  getPlansDir() {
    return this.plansDir;
  }
}
function extractCodeBlocks(content) {
  const codeBlocks = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || "text",
      code: match[2].trimEnd()
    });
  }
  return codeBlocks;
}
function generateSectionId(title, index) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}-${index}`;
}
function parsePlanMarkdown(markdown) {
  const lines = markdown.split("\n");
  let title = "Plan";
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1];
  }
  const sections = [];
  let currentSection = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentSection) {
        const content = currentSection.contentLines.join("\n").trim();
        sections.push({
          id: generateSectionId(currentSection.title, sections.length),
          title: currentSection.title,
          level: currentSection.level,
          content,
          codeBlocks: extractCodeBlocks(content)
        });
      }
      currentSection = {
        title: h2Match[1],
        level: 2,
        contentLines: [],
        startIndex: i
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    }
  }
  if (currentSection) {
    const content = currentSection.contentLines.join("\n").trim();
    sections.push({
      id: generateSectionId(currentSection.title, sections.length),
      title: currentSection.title,
      level: currentSection.level,
      content,
      codeBlocks: extractCodeBlocks(content)
    });
  }
  return { title, sections };
}
function serializePlanFile(plan) {
  return {
    ...plan,
    modified: plan.modified.toISOString()
  };
}
const getPlans_createServerFn_handler = createServerRpc({
  id: "02f2634e2d29bb66556ea859fdb4dd40c962defee00971c7ad724454be68fb6e",
  name: "getPlans",
  filename: "src/server/plans.ts"
}, (opts, signal) => getPlans.__executeServer(opts, signal));
const getPlans = createServerFn({
  method: "GET"
}).handler(getPlans_createServerFn_handler, async () => {
  const reader = new PlanReader();
  const plans = reader.scanPlans();
  return {
    plans: plans.map(serializePlanFile),
    total: plans.length
  };
});
const getPlan_createServerFn_handler = createServerRpc({
  id: "a186dc17780a3a9b52a89fc8d49499e923dd202d120c2f377a43984df1de9bb1",
  name: "getPlan",
  filename: "src/server/plans.ts"
}, (opts, signal) => getPlan.__executeServer(opts, signal));
const getPlan = createServerFn({
  method: "GET"
}).handler(getPlan_createServerFn_handler, async (ctx) => {
  const filename = ctx.data;
  const reader = new PlanReader();
  const content = reader.readPlan(filename);
  return {
    content,
    parsed: content ? parsePlanMarkdown(content) : null,
    filename
  };
});
export {
  getPlan_createServerFn_handler,
  getPlans_createServerFn_handler
};
