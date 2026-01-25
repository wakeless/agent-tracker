import React from 'react';
interface TasksListViewProps {
    selectedConversationId: string | null;
    onSelectTaskSet: (conversationId: string | null) => void;
    onViewTaskSet: (conversationId: string) => void;
    onSwitchToSessions: () => void;
}
export declare function TasksListView({ selectedConversationId, onSelectTaskSet, onViewTaskSet, onSwitchToSessions, }: TasksListViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=TasksListView.d.ts.map