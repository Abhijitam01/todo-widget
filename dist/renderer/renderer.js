"use strict";
class TodoApp {
    constructor() {
        this.todos = [];
        this.editingTodoId = null;
        this.contextMenuVisible = false;
        this.selectedTodoId = null;
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
    initializeElements() {
        // Input elements
        this.todoInput = document.getElementById('todoInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        // Display elements
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        // Stats elements
        this.totalCount = document.getElementById('totalCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.completedCount = document.getElementById('completedCount');
        // Menu elements
        this.contextMenu = document.getElementById('contextMenu');
        // Window controls
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.closeBtn = document.getElementById('closeBtn');
    }
    setupEventListeners() {
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
            if (!this.contextMenu.contains(e.target)) {
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
    generateId() {
        return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    addTodo() {
        const text = this.todoInput.value.trim();
        console.log('Adding todo:', text);
        if (!text) {
            console.log('No text provided, returning');
            return;
        }
        const todo = {
            id: this.generateId(),
            text,
            completed: false,
            priority: this.prioritySelect.value,
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
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date();
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo)
            return;
        this.editingTodoId = id;
        // Create inline edit
        const todoItem = document.querySelector(`[data-todo-id="${id}"]`);
        const textElement = todoItem.querySelector('.todo-text');
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
            }
            else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        input.addEventListener('blur', saveEdit);
    }
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }
    cancelEdit() {
        if (this.editingTodoId) {
            this.editingTodoId = null;
            this.render();
        }
    }
    showContextMenu(e, todoId) {
        e.preventDefault();
        this.selectedTodoId = todoId;
        this.contextMenuVisible = true;
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.style.top = `${e.clientY}px`;
        this.contextMenu.classList.add('visible');
    }
    hideContextMenu() {
        this.contextMenuVisible = false;
        this.selectedTodoId = null;
        this.contextMenu.classList.remove('visible');
    }
    createTodoElement(todo) {
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
        const checkbox = todoItem.querySelector('.todo-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTodo(todo.id);
        });
        const editBtn = todoItem.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTodo(todo.id);
        });
        const deleteBtn = todoItem.querySelector('.delete-btn');
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
    sortTodos() {
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
    render() {
        const sortedTodos = this.sortTodos();
        // Clear todo list
        this.todoList.innerHTML = '';
        // Show/hide empty state
        if (sortedTodos.length === 0) {
            this.emptyState.classList.remove('hidden');
        }
        else {
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
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        this.totalCount.textContent = total.toString();
        this.completedCount.textContent = completed.toString();
        this.pendingCount.textContent = pending.toString();
    }
    saveTodos() {
        try {
            const todosData = JSON.stringify(this.todos);
            localStorage.setItem('errika-todos', todosData);
            console.log('Todos saved:', this.todos.length, 'items');
        }
        catch (error) {
            console.error('Failed to save todos:', error);
        }
    }
    loadTodos() {
        try {
            const saved = localStorage.getItem('errika-todos');
            console.log('Loading todos from storage:', saved);
            if (saved) {
                this.todos = JSON.parse(saved).map((todo) => ({
                    ...todo,
                    createdAt: new Date(todo.createdAt),
                    updatedAt: new Date(todo.updatedAt)
                }));
                console.log('Loaded', this.todos.length, 'todos');
            }
            else {
                console.log('No saved todos found');
                this.todos = [];
            }
        }
        catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
        }
    }
    escapeHtml(text) {
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
    const createParticle = (x, y) => {
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
//# sourceMappingURL=renderer.js.map