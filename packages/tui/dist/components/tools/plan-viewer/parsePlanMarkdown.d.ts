/**
 * Parses markdown plan content into structured sections for navigation.
 */
export interface CodeBlock {
    language: string;
    code: string;
}
export interface PlanSection {
    id: string;
    title: string;
    level: number;
    content: string;
    codeBlocks: CodeBlock[];
}
export interface ParsedPlan {
    title: string;
    sections: PlanSection[];
}
/**
 * Parse markdown into structured plan with sections.
 * Sections are defined by H2 (##) headings.
 */
export declare function parsePlanMarkdown(markdown: string): ParsedPlan;
//# sourceMappingURL=parsePlanMarkdown.d.ts.map