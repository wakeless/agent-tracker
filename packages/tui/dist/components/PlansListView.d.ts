import React from 'react';
import { PlanFile } from '@agent-tracker/core';
interface PlansListViewProps {
    selectedPlanFilename: string | null;
    onSelectPlan: (filename: string | null) => void;
    onViewPlan: (planFile: PlanFile, content: string) => void;
    onSwitchToSessions: () => void;
}
export declare function PlansListView({ selectedPlanFilename, onSelectPlan, onViewPlan, onSwitchToSessions, }: PlansListViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=PlansListView.d.ts.map