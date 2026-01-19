import React from 'react';
import type { PlanSection as PlanSectionType } from './parsePlanMarkdown.js';
interface PlanSectionProps {
    section: PlanSectionType;
    index: number;
    totalSections: number;
    isSelected: boolean;
    isExpanded: boolean;
}
/**
 * Displays a single plan section with collapse/expand support.
 */
export declare function PlanSection({ section, index, totalSections, isSelected, isExpanded, }: PlanSectionProps): React.JSX.Element;
export {};
//# sourceMappingURL=PlanSection.d.ts.map