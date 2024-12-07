"use strict";
var LocationTask;
(function (LocationTask) {
    LocationTask["MOSCOW"] = "\u041C\u043E\u0441\u043A\u0432\u0430";
    LocationTask["TVER"] = "\u0422\u0432\u0435\u0440\u044C";
    LocationTask["EKATERINBURG"] = "\u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u0431\u0443\u0440\u0433";
})(LocationTask || (LocationTask = {}));
var Status;
(function (Status) {
    Status["OPEN"] = "\u041D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E";
    Status["DONE"] = "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E";
    Status["ALL"] = "\u0412\u0441\u0435";
})(Status || (Status = {}));
var TaskType;
(function (TaskType) {
    TaskType["OFFICE"] = "\u0417\u0430\u0434\u0430\u0447\u0430 \u0432 \u043E\u0444\u0438\u0441\u0435";
    TaskType["DEADLINE"] = "\u0417\u0430\u0434\u0430\u0447\u0430 \u0441 \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u043E\u043C";
    TaskType["ASSIGNEE"] = "\u0417\u0430\u0434\u0430\u0447\u0430 \u0441 \u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u043C \u043B\u0438\u0446\u043E\u043C";
    TaskType["ALL"] = "\u0412\u0441\u0435";
})(TaskType || (TaskType = {}));
// Создаем массив сотрудников
const employees = [
    { id: 1, name: "Иван Иванов", position: "Менеджер" },
    { id: 2, name: "Андрей Андреев", position: "Разработчик" },
    { id: 3, name: "Олег Олегов", position: "Дизайнер" }
];
const taskTypes = [TaskType.OFFICE, TaskType.DEADLINE, TaskType.ASSIGNEE];
const statuses = [Status.OPEN, Status.DONE];
const locations = [LocationTask.MOSCOW, LocationTask.TVER, LocationTask.EKATERINBURG];
class TaskManager {
    constructor() {
        this.tasks = [];
        this.createTaskButton = document.getElementById('createTaskButton');
        this.saveTaskButton = document.getElementById('saveTask');
        this.titleInput = document.getElementById('titleInput');
        this.descriptionInput = document.getElementById('descriptionInput');
        this.taskDeadlineInput = document.getElementById('taskDeadline');
        this.taskTypeSelect = document.getElementById('taskType');
        this.taskStatusSelect = document.getElementById('taskStatus');
        this.taskAssigneeSelect = document.getElementById('taskAssignee');
        this.taskLocationSelect = document.getElementById('taskLocation');
        this.filterStatusSelect = document.getElementById('filterStatus');
        this.filterTypeSelect = document.getElementById('filterType');
        this.applyFiltersButton = document.getElementById('applyFilters');
        this.taskList = document.getElementById('tasksList');
        this.modal = new Modal();
        this.currentId = null;
        this.isTaskListOpen = false;
        this._openModal = this._openModal.bind(this);
        this._createTask = this._createTask.bind(this);
        this._changeVisibleFields = this._changeVisibleFields.bind(this);
        this._addTask = this._addTask.bind(this);
        this._loadTasks();
        this._attachListeners();
        this._renderSelects();
    }
    _renderSelects() {
        this._renderSelect(this.taskTypeSelect, taskTypes);
        this._renderSelect(this.taskStatusSelect, statuses);
        this._renderSelect(this.taskAssigneeSelect, ['Не назначен', ...employees.map(employ => employ.name)]);
        this._renderSelect(this.taskLocationSelect, locations);
        this._renderSelect(this.filterTypeSelect, ['Все', ...taskTypes]);
        this._renderSelect(this.filterStatusSelect, ['Все', ...statuses]);
    }
    _applyFilters() {
        const selectedStatus = this.filterStatusSelect.value;
        const selectedType = this.filterTypeSelect.value;
        // Убедимся, что мы передаем правильные значения для фильтрации
        const filteredTasks = this.filterTasks(selectedStatus, selectedType);
        this._renderTaskList(filteredTasks);
    }
    filterTasks(status, type) {
        return this.tasks.filter((task) => {
            const statusMatch = !status || status === 'Все' || task.status === status;
            const typeMatch = !type || type === 'Все' || task.type === type;
            return statusMatch && typeMatch;
        });
    }
    _resetContent() {
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.taskDeadlineInput.value = '';
        this.taskTypeSelect.value = TaskType.OFFICE;
        this.taskStatusSelect.value = Status.OPEN;
        this.taskLocationSelect.value = LocationTask.MOSCOW;
        this.taskAssigneeSelect.value = 'Не назначен';
        this.currentId = null;
    }
    _changeVisibleFields() {
        switch (this.taskTypeSelect.value) {
            case TaskType.DEADLINE:
                this.taskAssigneeSelect?.parentElement?.classList.add('hide');
                this.taskDeadlineInput?.parentElement?.classList.remove('hide');
                this.taskLocationSelect?.parentElement?.classList.add('hide');
                break;
            case TaskType.ASSIGNEE:
                this.taskAssigneeSelect?.parentElement?.classList.remove('hide');
                this.taskDeadlineInput?.parentElement?.classList.add('hide');
                this.taskLocationSelect?.parentElement?.classList.add('hide');
                break;
            default:
                this.taskAssigneeSelect?.parentElement?.classList.add('hide');
                this.taskDeadlineInput?.parentElement?.classList.add('hide');
                this.taskLocationSelect?.parentElement?.classList.remove('hide');
                break;
        }
    }
    _attachListeners() {
        this.createTaskButton?.addEventListener('click', this._createTask);
        this.saveTaskButton.addEventListener('click', this._addTask);
        this.taskTypeSelect.addEventListener('change', this._changeVisibleFields);
        this.applyFiltersButton.addEventListener('click', this._applyFilters.bind(this));
        this.taskList.addEventListener('click', (event) => {
            const parentElement = event.target.parentElement;
            const removeButton = document.querySelectorAll('.remove-button');
            this.isTaskListOpen = true;
            if (parentElement?.classList.contains('wrapper')) {
                this._showCurrentTask(parentElement.parentElement.dataset.id);
            }
            removeButton.forEach((button) => {
                if (button.dataset.id === event.target.dataset.id) {
                    this._removeTask(event.target.dataset.id);
                }
            });
        });
    }
    _renderSelect(select, options) {
        options.forEach((item) => {
            const option = document.createElement('option');
            option.text = item;
            option.value = item;
            select.append(option);
        });
    }
    _renderTaskList(tasks) {
        this.taskList.textContent = '';
        if (!tasks && !this.tasks || this.tasks.length === 0) {
            this.taskList.textContent = 'Список задач пуст';
        }
        else if (tasks && tasks.length === 0) {
            this.taskList.textContent = 'Нет совпадений. Попробуйте по другому';
        }
        const arrayTasks = tasks ?? this.tasks;
        arrayTasks.forEach((task) => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            const spanTitle = document.createElement('span');
            const spanTaskType = document.createElement('span');
            const spanTaskStatus = document.createElement('span');
            const spanWrapper = document.createElement('span');
            const button = document.createElement('button');
            spanTitle.textContent = task.title;
            spanTaskType.textContent = task.type;
            spanTaskStatus.textContent = task.status;
            button.textContent = 'Удалить';
            button.dataset.id = task.id;
            spanWrapper.classList.add('wrapper');
            button.id = 'removeTaskButton';
            button.classList.add('remove-button');
            spanWrapper.appendChild(spanTitle);
            spanWrapper.appendChild(spanTaskType);
            spanWrapper.appendChild(spanTaskStatus);
            li.appendChild(spanWrapper);
            li.appendChild(button);
            this.taskList.appendChild(li);
        });
    }
    _createTask() {
        this._resetContent();
        this._changeVisibleFields();
        this._openModal();
    }
    _openModal() {
        this.modal.openModal();
    }
    _closeModal() {
        this.modal.closeModal();
    }
    _addTask() {
        const task = {
            id: this.currentId ?? this.generateUUID(),
            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            createDate: new Date(),
            status: this.taskStatusSelect.value,
            type: this.taskTypeSelect.value,
        };
        if (this.taskTypeSelect.value === TaskType.OFFICE) {
            task.location = this.taskLocationSelect.value;
        }
        if (this.taskTypeSelect.value === TaskType.DEADLINE) {
            task.deadline = this.taskDeadlineInput.value;
        }
        if (this.taskTypeSelect.value === TaskType.ASSIGNEE) {
            task.assignee = this.taskAssigneeSelect.value;
        }
        if (!task.title.length) {
            alert('Пожалуйста, опишите задачу');
            return;
        }
        const currentTaskIndex = this.tasks.findIndex(task => {
            return task.id === this.currentId;
        });
        if (currentTaskIndex !== -1) {
            this.tasks[currentTaskIndex] = task;
        }
        else {
            this.tasks.push(task);
        }
        this.saveTasks();
        this._closeModal();
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0; // Генерируем случайное число от 0 до 15
            const v = c === 'x' ? r : (r & 0x3 | 0x8); // Устанавливаем версию и вариант
            return v.toString(16); // Возвращаем символ в шестнадцатеричном формате
        });
    }
    _showCurrentTask(id) {
        this._openModal();
        const task = this.tasks.find(task => {
            return task.id === id;
        });
        if (task) {
            this.currentId = task.id;
            this.titleInput.value = task.title;
            this.descriptionInput.value = task.description;
            this.taskTypeSelect.value = task.type;
            if (task.deadline) {
                this.taskDeadlineInput.value = task.deadline;
            }
            if (task.location) {
                this.taskLocationSelect.value = task.location;
            }
            if (task.assignee) {
                this.taskAssigneeSelect.value = task.assignee;
            }
            this._changeVisibleFields();
        }
    }
    _removeTask(id) {
        this.tasks = this.tasks.filter(task => {
            return task.id !== id;
        });
        this.saveTasks();
        this._renderTaskList();
    }
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this._renderTaskList();
    }
    _loadTasks() {
        const tasksData = localStorage.getItem('tasks');
        if (tasksData) {
            const tasks = JSON.parse(tasksData);
            const validTasks = tasks.filter(task => this.isTask(task));
            if ((validTasks && validTasks.length) || []) {
                this.tasks = JSON.parse(tasksData);
                console.log('hello');
            }
            else {
                return;
            }
        }
        this._renderTaskList();
    }
    // проверяем данные из LS, если что то не так - убираем из списка
    isTask(task) {
        return (typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.description === "string" &&
            task.createDate instanceof Date &&
            Object.values(Status).includes(task.status) &&
            Object.values(TaskType).includes(task.type));
    }
}
class Modal {
    constructor() {
        this.attachListeners();
    }
    attachListeners() {
        document.getElementById('closeModal')?.addEventListener('click', this.closeModal);
        document.getElementById('overlay')?.addEventListener('click', this.closeModal);
    }
    openModal() {
        document.getElementById('modal')?.classList.add('active');
        document.getElementById('overlay')?.classList.add('active');
    }
    closeModal() {
        document.getElementById('modal')?.classList.remove('active');
        document.getElementById('overlay')?.classList.remove('active');
    }
}
const taskManager = new TaskManager();
