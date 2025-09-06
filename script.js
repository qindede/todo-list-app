// 获取DOM元素
const todoInput = document.getElementById('todo-input');
const dueDateInput = document.getElementById('due-date-input');
const priorityInput = document.getElementById('priority-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');
const priorityButtons = document.querySelectorAll('.priority-btn');
const viewButtons = document.querySelectorAll('.view-btn');
const quadrantView = document.getElementById('quadrant-view');
const quadrants = {
    'important-urgent': document.querySelector('#important-urgent .quadrant-list'),
    'important-not-urgent': document.querySelector('#important-not-urgent .quadrant-list'),
    'not-important-urgent': document.querySelector('#not-important-urgent .quadrant-list'),
    'not-important-not-urgent': document.querySelector('#not-important-not-urgent .quadrant-list')
};

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
function renderTodos(filter = 'all', priority = 'all', view = 'list') {
    // 清空列表
    todoList.innerHTML = '';
    
    // 清空四象限视图
    Object.values(quadrants).forEach(quadrant => {
        quadrant.innerHTML = '';
    });
    
    // 根据过滤条件筛选待办事项
    let filteredTodos = todos;
    if (filter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }
    
    // 根据优先级筛选
    if (priority !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
    }
    
    // 如果没有待办事项，显示空状态
    if (filteredTodos.length === 0) {
        if (view === 'list') {
            const emptyState = document.createElement('div');
            emptyState.classList.add('empty-state');
            emptyState.innerHTML = `
                <i class="fas fa-clipboard-list empty-icon"></i>
                <p>${filter === 'all' ? '没有待办事项' : filter === 'active' ? '没有未完成的待办事项' : '没有已完成的待办事项'}</p>
            `;
            todoList.appendChild(emptyState);
        }
        return;
    }
    
    // 渲染筛选后的待办事项
    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.classList.add('todo-item');
        todoItem.dataset.id = todo.id;
        todoItem.dataset.priority = todo.priority;
        todoItem.draggable = true;
        
        // 添加优先级类
        todoItem.classList.add(todo.priority);
        
        if (todo.completed) {
            todoItem.classList.add('completed');
        }
        
        // 检查是否有截止日期且已过期
        if (todo.dueDate && !todo.completed) {
            const dueDate = new Date(todo.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
                todoItem.classList.add('overdue');
            } else if (isSameDay(dueDate, today)) {
                todoItem.classList.add('due-today');
            }
        }
        
        // 创建复选框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('todo-checkbox');
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));
        
        // 创建文本容器
        const textContainer = document.createElement('div');
        textContainer.classList.add('text-container');
        
        // 创建文本
        const todoText = document.createElement('span');
        todoText.classList.add('todo-text');
        todoText.textContent = todo.text;
        todoText.addEventListener('dblclick', () => startEditing(todo.id));
        
        // 添加文本到容器
        textContainer.appendChild(todoText);
        
        // 如果有截止日期，添加日期显示
        if (todo.dueDate) {
            const dateDisplay = document.createElement('span');
            dateDisplay.classList.add('due-date');
            
            const dueDate = new Date(todo.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (isSameDay(dueDate, today)) {
                dateDisplay.textContent = '今天';
                dateDisplay.classList.add('due-today');
            } else if (isSameDay(dueDate, tomorrow)) {
                dateDisplay.textContent = '明天';
                dateDisplay.classList.add('due-soon');
            } else if (dueDate < today) {
                dateDisplay.textContent = formatDate(dueDate) + ' (已过期)';
                dateDisplay.classList.add('overdue');
            } else {
                dateDisplay.textContent = formatDate(dueDate);
            }
            
            textContainer.appendChild(dateDisplay);
        }
        
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
        todoItem.appendChild(textContainer);
        todoItem.appendChild(actions);
        
        // 根据视图模式添加到不同容器
        if (view === 'list') {
            todoList.appendChild(todoItem);
        } else if (view === 'quadrant') {
            // 复制节点添加到对应象限
            const quadrantItem = todoItem.cloneNode(true);
            // 重新添加事件监听器
            const checkbox = quadrantItem.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => toggleTodo(todo.id));
            
            const editBtn = quadrantItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => startEditing(todo.id));
            
            const deleteBtn = quadrantItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            // 添加到对应象限
            quadrants[todo.priority].appendChild(quadrantItem);
        }
    });
    
    // 更新剩余项目数量
    const activeTodos = todos.filter(todo => !todo.completed);
    itemsLeft.textContent = `${activeTodos.length} 项待办`;
}

// 添加新的待办事项
function addTodo() {
    const text = todoInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;
    
    if (text) {
        const newTodo = {
            id: Date.now(),
            text,
            completed: false,
            dueDate: dueDate || null,
            priority: priority || 'not-important-not-urgent'
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos(getCurrentFilter(), getCurrentPriority(), getCurrentView());
        
        // 清空输入框
        todoInput.value = '';
        dueDateInput.value = '';
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
    renderTodos(getCurrentFilter(), getCurrentPriority(), getCurrentView());
}

// 删除待办事项
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos(getCurrentFilter(), getCurrentPriority(), getCurrentView());
}

// 清除已完成的待办事项
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos(getCurrentFilter(), getCurrentPriority(), getCurrentView());
}

// 获取当前过滤条件
function getCurrentFilter() {
    const activeFilter = document.querySelector('.filter-btn.active');
    return activeFilter ? activeFilter.dataset.filter : 'all';
}

// 获取当前优先级过滤条件
function getCurrentPriority() {
    const activePriorityBtn = document.querySelector('.priority-btn.active');
    return activePriorityBtn ? activePriorityBtn.dataset.priority : 'all';
}

// 获取当前视图模式
function getCurrentView() {
    const activeViewBtn = document.querySelector('.view-btn.active');
    return activeViewBtn ? activeViewBtn.dataset.view : 'list';
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
    
    renderTodos(filter, getCurrentPriority(), getCurrentView());
}

// 设置优先级过滤条件
function setPriority(priority) {
    priorityButtons.forEach(btn => {
        if (btn.dataset.priority === priority) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTodos(getCurrentFilter(), priority, getCurrentView());
}

// 设置视图模式
function setView(view) {
    viewButtons.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 切换视图显示
    if (view === 'quadrant') {
        todoList.style.display = 'none';
        quadrantView.style.display = 'grid';
    } else {
        todoList.style.display = 'block';
        quadrantView.style.display = 'none';
    }
    
    renderTodos(getCurrentFilter(), getCurrentPriority(), view);
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
    const textContainer = todoItem.querySelector('.text-container');
    const todoText = textContainer.querySelector('.todo-text');
    const currentText = todoText.textContent;
    
    // 获取当前待办事项
    const todo = todos.find(t => t.id === id);
    
    // 创建编辑容器
    const editContainer = document.createElement('div');
    editContainer.classList.add('edit-container');
    
    // 创建编辑输入框
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('edit-input');
    editInput.value = currentText;
    
    // 创建日期输入框
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.classList.add('edit-date-input');
    if (todo.dueDate) {
        dateInput.value = todo.dueDate;
    }
    
    // 创建优先级选择框
    const prioritySelect = document.createElement('select');
    prioritySelect.classList.add('edit-priority');
    
    const priorities = [
        { value: 'important-urgent', text: '重要且紧急' },
        { value: 'important-not-urgent', text: '重要不紧急' },
        { value: 'not-important-urgent', text: '紧急不重要' },
        { value: 'not-important-not-urgent', text: '不重要不紧急' }
    ];
    
    priorities.forEach(p => {
        const option = document.createElement('option');
        option.value = p.value;
        option.textContent = p.text;
        if (todo.priority === p.value) {
            option.selected = true;
        }
        prioritySelect.appendChild(option);
    });
    
    // 添加输入框到编辑容器
    editContainer.appendChild(editInput);
    editContainer.appendChild(dateInput);
    editContainer.appendChild(prioritySelect);
    
    // 替换文本容器为编辑容器
    todoItem.replaceChild(editContainer, textContainer);
    editInput.focus();
    
    // 添加事件监听器
    editInput.addEventListener('blur', () => finishEditing(id, editInput, dateInput, prioritySelect));
    dateInput.addEventListener('blur', () => finishEditing(id, editInput, dateInput, prioritySelect));
    prioritySelect.addEventListener('blur', () => finishEditing(id, editInput, dateInput, prioritySelect));
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEditing(id, editInput, dateInput, prioritySelect);
        }
    });
}

// 完成编辑待办事项
function finishEditing(id, editInput, dateInput, prioritySelect) {
    const newText = editInput.value.trim();
    const newDate = dateInput.value;
    const newPriority = prioritySelect.value;
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    
    if (newText) {
        // 更新待办事项文本、日期和优先级
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { 
                    ...todo, 
                    text: newText,
                    dueDate: newDate || todo.dueDate,
                    priority: newPriority || todo.priority
                };
            }
            return todo;
        });
        
        saveTodos();
    }
    
    // 重新渲染
    renderTodos(getCurrentFilter(), getCurrentPriority(), getCurrentView());
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

// 检查两个日期是否是同一天
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 格式化日期为易读格式
function formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// 检查并提醒即将到期的任务
function checkDueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueTodayTasks = todos.filter(todo => 
        !todo.completed && todo.dueDate && isSameDay(new Date(todo.dueDate), today)
    );
    
    const dueTomorrowTasks = todos.filter(todo => 
        !todo.completed && todo.dueDate && isSameDay(new Date(todo.dueDate), tomorrow)
    );
    
    const overdueTasks = todos.filter(todo => 
        !todo.completed && todo.dueDate && new Date(todo.dueDate) < today
    );
    
    if (dueTodayTasks.length > 0 || dueTomorrowTasks.length > 0 || overdueTasks.length > 0) {
        let message = '';
        
        if (overdueTasks.length > 0) {
            message += `您有 ${overdueTasks.length} 个已过期的任务！\n`;
        }
        
        if (dueTodayTasks.length > 0) {
            message += `您有 ${dueTodayTasks.length} 个今天到期的任务！\n`;
        }
        
        if (dueTomorrowTasks.length > 0) {
            message += `您有 ${dueTomorrowTasks.length} 个明天到期的任务！`;
        }
        
        showReminderToast(message);
    }
}

// 显示提醒通知
function showReminderToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast', 'reminder-toast');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 5秒后自动消失
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    enableDragSort();
    setupKeyboardShortcuts();
    
    // 显示欢迎提示
    if (todos.length === 0) {
        showWelcomeToast();
    } else {
        // 检查到期任务
        checkDueTasks();
    }
    
    // 设置优先级按钮事件监听
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setPriority(btn.dataset.priority);
        });
    });
    
    // 设置视图按钮事件监听
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setView(btn.dataset.view);
        });
    });
    
    // 默认激活第一个优先级按钮
    if (priorityButtons.length > 0) {
        priorityButtons[0].classList.add('active');
    }
});

// 获取优先级显示文本
function getPriorityText(priority) {
    const priorityMap = {
        'important-urgent': '重要且紧急',
        'important-not-urgent': '重要不紧急',
        'not-important-urgent': '紧急不重要',
        'not-important-not-urgent': '不重要不紧急'
    };
    return priorityMap[priority] || '';
}

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