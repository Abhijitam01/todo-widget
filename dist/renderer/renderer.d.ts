interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Date;
    updatedAt: Date;
}
declare class TodoApp {
    private todos;
    private editingTodoId;
    private contextMenuVisible;
    private selectedTodoId;
    private todoInput;
    private prioritySelect;
    private addTodoBtn;
    private todoList;
    private emptyState;
    private totalCount;
    private pendingCount;
    private completedCount;
    private contextMenu;
    private minimizeBtn;
    private closeBtn;
    constructor();
    private initializeElements;
    private setupEventListeners;
    private generateId;
    private addTodo;
    private toggleTodo;
    private editTodo;
    private deleteTodo;
    private cancelEdit;
    private showContextMenu;
    private hideContextMenu;
    private createTodoElement;
    private sortTodos;
    private render;
    private updateStats;
    private saveTodos;
    private loadTodos;
    private escapeHtml;
}
//# sourceMappingURL=renderer.d.ts.map