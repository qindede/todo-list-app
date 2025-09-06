// 获取DOM元素
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// 初始化待办事项数组
let todos = [];

// 从本地存储加载待办事项
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
        renderTodos();
    }
}

// 保存待办事项到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 渲染待办事项列表
function renderTodos(filter = 'all') {
    // 清空列表
    todoList.innerHTML = '';
    
    // 根据过滤条件筛选待办事项
    let filteredTodos = todos;
    if (filter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }
    
    // 如果没有待办事项，显示空状态
    if (filteredTodos.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.classList.add('empty-state');
        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list empty-icon"></i>
            <p>${filter === 'all' ? '没有待办事项' : filter === 'active' ? '没有未完成的待办事项' : '没有已完成的待办事项'}</p>
        `;
        todoList.appendChild(emptyState);
    }
    
    // 渲染筛选后的待办事项
    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.classList.add('todo-item');
        todoItem.dataset.id = todo.id;
        todoItem.draggable = true;
        if (todo.completed) {
            todoItem.classList.add('completed');
        }
        
        // 创建复选框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('todo-checkbox');
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));
        
        // 创建文本
        const todoText = document.createElement('span');
        todoText.classList.add('todo-text');
        todoText.textContent = todo.text;
        todoText.addEventListener('dblclick', () => startEditing(todo.id));
        
        // 创建操作按钮容器
        const actions = document.createElement('div');
        actions.classList.add('todo-actions');
        
        // 创建编辑按钮
        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => startEditing(todo.id));
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        // 将按钮添加到操作容器
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        // 将元素添加到列表项
        todoItem.appendChild(checkbox);
        todoItem.appendChild(todoText);
        todoItem.appendChild(actions);
        
        // 将列表项添加到列表
        todoList.appendChild(todoItem);
    });
    
    // 更新剩余项目数量
    const activeTodos = todos.filter(todo => !todo.completed);
    itemsLeft.textContent = `${activeTodos.length} 项待办`;
}

// 添加新的待办事项
function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        const newTodo = {
            id: Date.now(),
            text,
            completed: false
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos(getCurrentFilter());
        
        // 清空输入框
        todoInput.value = '';
        todoInput.focus();
    }
}

// 切换待办事项的完成状态
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    
    saveTodos();
    renderTodos(getCurrentFilter());
}

// 删除待办事项
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos(getCurrentFilter());
}

// 清除已完成的待办事项
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos(getCurrentFilter());
}

// 获取当前过滤条件
function getCurrentFilter() {
    const activeFilter = document.querySelector('.filter-btn.active');
    return activeFilter ? activeFilter.dataset.filter : 'all';
}

// 设置过滤条件
function setFilter(filter) {
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTodos(filter);
}

// 事件监听
addButton.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
    });
});

// 开始编辑待办事项
function startEditing(id) {
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    const todoText = todoItem.querySelector('.todo-text');
    const currentText = todoText.textContent;
    
    // 创建编辑输入框
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('edit-input');
    editInput.value = currentText;
    
    // 替换文本为输入框
    todoItem.replaceChild(editInput, todoText);
    editInput.focus();
    
    // 添加事件监听器
    editInput.addEventListener('blur', () => finishEditing(id, editInput));
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEditing(id, editInput);
        }
    });
}

// 完成编辑待办事项
function finishEditing(id, editInput) {
    const newText = editInput.value.trim();
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    
    if (newText) {
        // 更新待办事项文本
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, text: newText };
            }
            return todo;
        });
        
        saveTodos();
    }
    
    // 重新渲染
    renderTodos(getCurrentFilter());
}

// 添加拖放排序功能
function enableDragSort() {
    let draggedItem = null;
    
    // 添加拖拽事件监听器
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('todo-item')) {
            draggedItem = e.target;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedItem.innerHTML);
            e.target.classList.add('dragging');
        }
    });
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItem) {
            const targetItem = e.target.closest('.todo-item');
            if (targetItem && targetItem !== draggedItem) {
                const rect = targetItem.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const isBelow = y > rect.height / 2;
                
                todoList.insertBefore(
                    draggedItem,
                    isBelow ? targetItem.nextSibling : targetItem
                );
            }
        }
    });
    
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('todo-item')) {
            e.target.classList.remove('dragging');
            updateTodosOrder();
        }
    });
}

// 更新待办事项顺序
function updateTodosOrder() {
    const todoItems = document.querySelectorAll('.todo-item');
    const newTodos = [];
    
    todoItems.forEach(item => {
        const id = parseInt(item.dataset.id);
        const todo = todos.find(t => t.id === id);
        if (todo) {
            newTodos.push(todo);
        }
    });
    
    todos = newTodos;
    saveTodos();
}

// 添加键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt+N: 新建待办事项
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            todoInput.focus();
        }
        
        // Alt+C: 清除已完成
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            clearCompleted();
        }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    enableDragSort();
    setupKeyboardShortcuts();
    
    // 显示欢迎提示
    if (todos.length === 0) {
        showWelcomeToast();
    }
});

// 显示欢迎提示
function showWelcomeToast() {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = '欢迎使用待办事项清单！添加您的第一个任务吧！';
    document.body.appendChild(toast);
    
    // 2秒后自动消失
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}