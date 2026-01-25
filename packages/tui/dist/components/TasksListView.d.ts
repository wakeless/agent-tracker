import React from 'react';
interface TasksListViewProps {
    selectedConversationId: string | null;
    onSelectTaskSet: (conversationId: string | null) => void;
    onViewTaskSet: (conversationId: string) => void;
}
export declare function TasksListView({ selectedConversationId, onSelectTaskSet, onViewTaskSet, }: TasksListViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=TasksListView.d.ts.map