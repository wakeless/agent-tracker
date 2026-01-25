import React from 'react';
import { Task } from '@agent-tracker/core';
interface TaskSetDetailViewProps {
    conversationId: string;
    selectedTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    onViewTask: (task: Task) => void;
    onBack: () => void;
}
export declare function TaskSetDetailView({ conversationId, selectedTaskId, onSelectTask, onViewTask, onBack, }: TaskSetDetailViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=TaskSetDetailView.d.ts.map