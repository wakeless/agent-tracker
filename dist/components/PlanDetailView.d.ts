import React from 'react';
interface PlanDetailViewProps {
    plan: string;
    allowedPrompts?: Array<{
        tool: string;
        prompt: string;
    }>;
}
export declare function PlanDetailView({ plan, allowedPrompts }: PlanDetailViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=PlanDetailView.d.ts.map