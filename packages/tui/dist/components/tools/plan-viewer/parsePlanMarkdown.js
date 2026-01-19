/**
 * Parses markdown plan content into structured sections for navigation.
 */
/**
 * Extract code blocks from markdown content.
 */
function extractCodeBlocks(content) {
    const codeBlocks = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlocks.push({
            language: match[1] || 'text',
            code: match[2].trimEnd(),
        });
    }
    return codeBlocks;
}
/**
 * Generate a stable ID from section title.
 */
function generateSectionId(title, index) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slug}-${index}`;
}
/**
 * Parse markdown into structured plan with sections.
 * Sections are defined by H2 (##) headings.
 */
export function parsePlanMarkdown(markdown) {
    const lines = markdown.split('\n');
    // Extract H1 title
    let title = 'Plan';
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
        title = h1Match[1];
    }
    const sections = [];
    let currentSection = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match H2 headings (## Title)
        const h2Match = line.match(/^##\s+(.+)$/);
        if (h2Match) {
            // Save previous section
            if (currentSection) {
                const content = currentSection.contentLines.join('\n').trim();
                sections.push({
                    id: generateSectionId(currentSection.title, sections.length),
                    title: currentSection.title,
                    level: currentSection.level,
                    content,
                    codeBlocks: extractCodeBlocks(content),
                });
            }
            // Start new section
            currentSection = {
                title: h2Match[1],
                level: 2,
                contentLines: [],
                startIndex: i,
            };
        }
        else if (currentSection) {
            // Add line to current section
            currentSection.contentLines.push(line);
        }
    }
    // Don't forget the last section
    if (currentSection) {
        const content = currentSection.contentLines.join('\n').trim();
        sections.push({
            id: generateSectionId(currentSection.title, sections.length),
            title: currentSection.title,
            level: currentSection.level,
            content,
            codeBlocks: extractCodeBlocks(content),
        });
    }
    return { title, sections };
}
//# sourceMappingURL=parsePlanMarkdown.js.map