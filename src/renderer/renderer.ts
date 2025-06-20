interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Date;
    updatedAt: Date;
}

class TodoApp {
    private todos: Todo[] = [];
    private editingTodoId: string | null = null;
    private contextMenuVisible = false;
    private selectedTodoId: string | null = null;

    // DOM elements
    private todoInput!: HTMLInputElement;
    private prioritySelect!: HTMLSelectElement;
    private addTodoBtn!: HTMLButtonElement;
    private todoList!: HTMLElement;
    private emptyState!: HTMLElement;
    private totalCount!: HTMLElement;
    private pendingCount!: HTMLElement;
    private completedCount!: HTMLElement;
    private contextMenu!: HTMLElement;
    private minimizeBtn!: HTMLButtonElement;
    private closeBtn!: HTMLButtonElement;

    constructor() {
        console.log('TodoApp constructor called');
        this.initializeElements();
        console.log('Elements initialized');
        this.setupEventListeners();
        console.log('Event listeners set up');
        this.loadTodos();
        console.log('Todos loaded:', this.todos);
        this.render();
        this.updateStats();
        console.log('TodoApp fully initialized');
    }

    private initializeElements(): void {
        // Input elements
        this.todoInput = document.getElementById('todoInput') as HTMLInputElement;
        this.prioritySelect = document.getElementById('prioritySelect') as HTMLSelectElement;
        this.addTodoBtn = document.getElementById('addTodoBtn') as HTMLButtonElement;
        
        // Display elements
        this.todoList = document.getElementById('todoList') as HTMLElement;
        this.emptyState = document.getElementById('emptyState') as HTMLElement;
        
        // Stats elements
        this.totalCount = document.getElementById('totalCount') as HTMLElement;
        this.pendingCount = document.getElementById('pendingCount') as HTMLElement;
        this.completedCount = document.getElementById('completedCount') as HTMLElement;
        
        // Menu elements
        this.contextMenu = document.getElementById('contextMenu') as HTMLElement;
        
        // Window controls
        this.minimizeBtn = document.getElementById('minimizeBtn') as HTMLButtonElement;
        this.closeBtn = document.getElementById('closeBtn') as HTMLButtonElement;
    }

    private setupEventListeners(): void {
        // Add todo
        this.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        // Window controls
        this.minimizeBtn.addEventListener('click', () => {
            window.electronAPI.windowMinimize();
        });

        this.closeBtn.addEventListener('click', () => {
            window.electronAPI.windowClose();
        });

        // Context menu
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target as Node)) {
                this.hideContextMenu();
            }
        });

        // Context menu actions
        document.getElementById('editTodo')?.addEventListener('click', () => {
            if (this.selectedTodoId) {
                this.editTodo(this.selectedTodoId);
            }
            this.hideContextMenu();
        });

        document.getElementById('deleteTodo')?.addEventListener('click', () => {
            if (this.selectedTodoId) {
                this.deleteTodo(this.selectedTodoId);
            }
            this.hideContextMenu();
        });

        // Auto-save
        window.addEventListener('beforeunload', () => {
            this.saveTodos();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEdit();
                this.hideContextMenu();
            }
        });
    }

    private generateId(): string {
        return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private addTodo(): void {
        const text = this.todoInput.value.trim();
        console.log('Adding todo:', text);
        if (!text) {
            console.log('No text provided, returning');
            return;
        }

        const todo: Todo = {
            id: this.generateId(),
            text,
            completed: false,
            priority: this.prioritySelect.value as Todo['priority'],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Created todo:', todo);
        this.todos.unshift(todo);
        console.log('Todos array after adding:', this.todos);
        this.todoInput.value = '';
        this.prioritySelect.value = 'medium';
        
        this.saveTodos();
        this.render();
        this.updateStats();

        // Focus input for quick adding
        this.todoInput.focus();
    }

    private toggleTodo(id: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date();
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    private editTodo(id: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingTodoId = id;
        
        // Create inline edit
        const todoItem = document.querySelector(`[data-todo-id="${id}"]`) as HTMLElement;
        const textElement = todoItem.querySelector('.todo-text') as HTMLElement;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'todo-edit-input';
        input.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 8px;
            color: white;
            font-size: 14px;
            width: 100%;
            backdrop-filter: blur(10px);
        `;

        textElement.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== todo.text) {
                todo.text = newText;
                todo.updatedAt = new Date();
                this.saveTodos();
            }
            this.editingTodoId = null;
            this.render();
            this.updateStats();
        };

        const cancelEdit = () => {
            this.editingTodoId = null;
            this.render();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });

        input.addEventListener('blur', saveEdit);
    }

    private deleteTodo(id: string): void {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    private cancelEdit(): void {
        if (this.editingTodoId) {
            this.editingTodoId = null;
            this.render();
        }
    }

    private showContextMenu(e: MouseEvent, todoId: string): void {
        e.preventDefault();
        this.selectedTodoId = todoId;
        this.contextMenuVisible = true;
        
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.style.top = `${e.clientY}px`;
        this.contextMenu.classList.add('visible');
    }

    private hideContextMenu(): void {
        this.contextMenuVisible = false;
        this.selectedTodoId = null;
        this.contextMenu.classList.remove('visible');
    }

    private createTodoElement(todo: Todo): HTMLElement {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
        todoItem.setAttribute('data-todo-id', todo.id);

        todoItem.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}">
                ${todo.completed ? '✓' : ''}
            </div>
            <div class="todo-text">${this.escapeHtml(todo.text)}</div>
            <div class="todo-actions">
                <button class="todo-action-btn edit-btn" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M12.146 2.146a.5.5 0 0 1 .708 0l1 1a.5.5 0 0 1 0 .708L9.207 8.5 7.5 9.207 8.207 7.5l4.646-4.646a.5.5 0 0 1 .708 0z"/>
                        <path d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                </button>
                <button class="todo-action-btn delete-btn" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84L13.962 3.5H14.5a.5.5 0 0 0 0-1h-1.004a.58.58 0 0 0-.01 0H11z"/>
                    </svg>
                </button>
            </div>
        `;

        // Event listeners
        const checkbox = todoItem.querySelector('.todo-checkbox') as HTMLElement;
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTodo(todo.id);
        });

        const editBtn = todoItem.querySelector('.edit-btn') as HTMLElement;
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTodo(todo.id);
        });

        const deleteBtn = todoItem.querySelector('.delete-btn') as HTMLElement;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTodo(todo.id);
        });

        // Context menu
        todoItem.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e, todo.id);
        });

        return todoItem;
    }

    private sortTodos(): Todo[] {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        
        return [...this.todos].sort((a, b) => {
            // Incomplete todos first
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Then by priority
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            // Finally by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    private render(): void {
        const sortedTodos = this.sortTodos();
        
        // Clear todo list
        this.todoList.innerHTML = '';
        
        // Show/hide empty state
        if (sortedTodos.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            
            // Add todos
            sortedTodos.forEach((todo, index) => {
                const todoElement = this.createTodoElement(todo);
                
                // Add stagger animation delay
                todoElement.style.animationDelay = `${index * 50}ms`;
                
                this.todoList.appendChild(todoElement);
            });
        }
    }

    private updateStats(): void {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.totalCount.textContent = total.toString();
        this.completedCount.textContent = completed.toString();
        this.pendingCount.textContent = pending.toString();
    }

    private saveTodos(): void {
        try {
            const todosData = JSON.stringify(this.todos);
            localStorage.setItem('errika-todos', todosData);
            console.log('Todos saved:', this.todos.length, 'items');
        } catch (error) {
            console.error('Failed to save todos:', error);
        }
    }

    private loadTodos(): void {
        try {
            const saved = localStorage.getItem('errika-todos');
            console.log('Loading todos from storage:', saved);
            if (saved) {
                this.todos = JSON.parse(saved).map((todo: any) => ({
                    ...todo,
                    createdAt: new Date(todo.createdAt),
                    updatedAt: new Date(todo.updatedAt)
                }));
                console.log('Loaded', this.todos.length, 'todos');
            } else {
                console.log('No saved todos found');
                this.todos = [];
            }
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Add some beautiful effects
document.addEventListener('DOMContentLoaded', () => {
    // Add particle effect on todo completion
    const createParticle = (x: number, y: number) => {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: #64b5f6;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: particle-burst 0.6s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 600);
    };

    // Add the particle animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particle-burst {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            100% {
                opacity: 0;
                transform: scale(3) translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
            }
        }
    `;
    document.head.appendChild(style);
}); 